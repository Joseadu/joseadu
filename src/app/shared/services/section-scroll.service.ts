import { inject, Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SmoothScrollService } from './smooth-scroll.service';
import { ScrollGestureService } from './scroll-gesture.service';
import { SECTION_SCROLL_CONFIG } from './scroll-section.config';

export interface SectionEntry {
  id: string;
  element: HTMLElement;
  /**
   * true = paginada con resistencia. Si además es más alta que la pantalla, se hace scroll libre dentro
   * y sus bordes hacen de muro con estiramiento. false = contenido totalmente libre, sin intervenir.
   */
  boundaryLocked: boolean;
}

/** Progreso del "tirón" hacia la sección adyacente: -1 (arriba) .. 1 (abajo); ±1 = umbral de commit alcanzado. */
type PullListener = (progress: number) => void;
type TransitionListener = (toId: string, durationS: number) => void;

/**
 * Orquesta el scroll "por secciones" con resistencia (rubber-band) + snap:
 * registra las secciones de la home, decide cuándo bloquear/liberar Lenis,
 * y traduce los gestos normalizados de ScrollGestureService en transiciones
 * suaves entre secciones.
 */
@Injectable({
  providedIn: 'root'
})
export class SectionScrollService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly smoothScroll = inject(SmoothScrollService);
  private readonly scrollGesture = inject(ScrollGestureService);

  readonly sections = signal<SectionEntry[]>([]);
  readonly activeSectionId = signal<string | null>(null);
  readonly isTransitioning = signal(false);
  readonly reducedMotion = signal(false);

  private initialized = false;
  private readonly triggers = new Map<string, ScrollTrigger>();
  private readonly sectionReadyResolvers = new Map<string, Array<() => void>>();
  private readonly sectionOffsets = new Map<string, number>();
  /** Si el contenido de una sección "boundary-locked" no cabe en el viewport, se trata como libre:
   *  si no, quedaría atrapada (solo rebote/salto, sin forma de hacer scroll para ver el resto). */
  private readonly sectionOverflowsViewport = new Map<string, boolean>();
  private readonly pullListeners = new Set<PullListener>();
  private readonly transitionListeners = new Set<TransitionListener>();

  private unsubscribeDelta: (() => void) | null = null;
  private unsubscribeGestureEnd: (() => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private reducedMotionQuery: MediaQueryList | null = null;
  private reducedMotionListener: ((e: MediaQueryListEvent) => void) | null = null;

  // Estado del gesto en curso sobre una sección boundary-locked.
  private gestureDistance = 0;
  private visualOffset = 0;
  private rubberbandEl: HTMLElement | null = null;
  private rubberbandSetter: ((value: number) => void) | null = null;
  /** Umbral de commit del gesto en curso: con el dedo se necesita menos recorrido que con la rueda. */
  private commitThresholdPx: number = SECTION_SCROLL_CONFIG.DRAG_COMMIT_THRESHOLD_PX;

  // Sección bloqueada pero más alta que la pantalla: scroll libre dentro y "muro" en sus bordes,
  // donde un gesto nuevo hacia fuera hace el mismo estiramiento que en una sección bloqueada.
  private gestureInProgress = false;
  private gestureStartedAtTop = false;
  private gestureStartedAtBottom = false;
  /** Sentido del estiramiento en curso desde un borde: 1 = hacia la siguiente, -1 = hacia la anterior. */
  private edgePull: 1 | -1 | null = null;
  private lastScrollY = 0;
  private scrollHandler: (() => void) | null = null;

  private ensureInit(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }
    this.initialized = true;

    this.scrollGesture.init();
    this.setupReducedMotion();

    this.ngZone.runOutsideAngular(() => {
      this.unsubscribeDelta = this.scrollGesture.onDelta((dy, _velocityY, isTouch) => this.handleDelta(dy, isTouch));
      this.unsubscribeGestureEnd = this.scrollGesture.onGestureEnd((velocityY) => this.handleGestureEnd(velocityY));

      this.keydownHandler = (e) => this.handleKeydown(e);
      window.addEventListener('keydown', this.keydownHandler);

      let resizeTimeout: ReturnType<typeof setTimeout>;
      this.resizeHandler = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => this.recalculate(), 150);
      };
      window.addEventListener('resize', this.resizeHandler);

      // Los gestos solo llegan mientras hay dedo/rueda: la inercia (sobre todo la nativa en móvil)
      // se detecta aquí, por la posición de scroll.
      this.lastScrollY = window.scrollY;
      this.scrollHandler = () => this.handleScroll();
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  private setupReducedMotion(): void {
    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion.set(this.reducedMotionQuery.matches);
    this.reducedMotionListener = (e) => this.reducedMotion.set(e.matches);
    this.reducedMotionQuery.addEventListener('change', this.reducedMotionListener);
  }

  registerSection(entry: SectionEntry): void {
    this.ensureInit();

    this.sections.update((current) => this.insertSorted(current, entry));

    const trigger = ScrollTrigger.create({
      trigger: entry.element,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => this.setActiveSection(entry.id),
      onEnterBack: () => this.setActiveSection(entry.id)
    });
    this.triggers.set(entry.id, trigger);

    this.recalculate();
    this.resolveSectionReady(entry.id);
  }

  unregisterSection(id: string): void {
    this.sections.update((current) => current.filter((s) => s.id !== id));
    this.triggers.get(id)?.kill();
    this.triggers.delete(id);
    this.sectionOffsets.delete(id);
    this.sectionOverflowsViewport.delete(id);
    if (this.rubberbandEl && this.sections().every((s) => s.element !== this.rubberbandEl)) {
      this.rubberbandEl = null;
      this.rubberbandSetter = null;
    }
  }

  /** Resuelve cuando la sección con ese id está registrada (usado por MainNavComponent tras navegar a home). */
  whenSectionReady(id: string): Promise<void> {
    if (this.sections().some((s) => s.id === id)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const list = this.sectionReadyResolvers.get(id) ?? [];
      list.push(resolve);
      this.sectionReadyResolvers.set(id, list);
    });
  }

  /** Se emite en cada tick del gesto sobre una sección boundary-locked, y con 0 al rebotar. Fuera de NgZone. */
  onPull(cb: PullListener): () => void {
    this.pullListeners.add(cb);
    return () => this.pullListeners.delete(cb);
  }

  /** Se emite al iniciar un cambio de sección, con la duración del scroll para poder sincronizarse. Fuera de NgZone. */
  onTransition(cb: TransitionListener): () => void {
    this.transitionListeners.add(cb);
    return () => this.transitionListeners.delete(cb);
  }

  /** Navegación directa (nav bar, scroll indicators, teclado): mismo camino que un gesto confirmado. */
  goToSection(id: string, opts?: { duration?: number }): void {
    this.commitTransition(id, { duration: opts?.duration });
  }

  recalculate(): void {
    this.sections().forEach((s) => {
      this.sectionOffsets.set(s.id, s.element.offsetTop);
      this.sectionOverflowsViewport.set(s.id, s.element.offsetHeight > window.innerHeight + 2);
    });
    ScrollTrigger.refresh();
  }

  /** true solo si la sección debe ir paginada con resistencia: lo pide y además cabe en el viewport. */
  private isBoundaryLocked(entry: SectionEntry): boolean {
    return entry.boundaryLocked && !this.sectionOverflowsViewport.get(entry.id);
  }

  private resolveSectionReady(id: string): void {
    const resolvers = this.sectionReadyResolvers.get(id);
    if (!resolvers) return;
    resolvers.forEach((resolve) => resolve());
    this.sectionReadyResolvers.delete(id);
  }

  private insertSorted(entries: SectionEntry[], newEntry: SectionEntry): SectionEntry[] {
    const idx = entries.findIndex(
      (e) => (e.element.compareDocumentPosition(newEntry.element) & Node.DOCUMENT_POSITION_PRECEDING) !== 0
    );
    const copy = [...entries];
    if (idx === -1) {
      copy.push(newEntry);
    } else {
      copy.splice(idx, 0, newEntry);
    }
    return copy;
  }

  private getActiveEntry(): SectionEntry | undefined {
    const id = this.activeSectionId();
    return this.sections().find((s) => s.id === id);
  }

  private getAdjacentId(direction: 1 | -1): string | null {
    const list = this.sections();
    const idx = list.findIndex((s) => s.id === this.activeSectionId());
    if (idx === -1) return null;
    return list[idx + direction]?.id ?? null;
  }

  /** Mantiene sincronizado el estado activo con el bloqueo/liberación de Lenis. */
  private setActiveSection(id: string): void {
    const entry = this.sections().find((s) => s.id === id);
    if (!entry) return;

    const changed = this.activeSectionId() !== id;
    if (changed) {
      this.activeSectionId.set(id);
    }

    if (this.isTransitioning()) {
      return;
    }

    // Cambio de sección sin commitTransition (carga inicial, scroll libre): también se notifica.
    if (changed) {
      this.transitionListeners.forEach((cb) => cb(id, SECTION_SCROLL_CONFIG.TRANSITION_DURATION_S));
    }

    if (this.isBoundaryLocked(entry)) {
      this.smoothScroll.stop();
    } else {
      this.smoothScroll.start();
    }
  }

  private handleDelta(dy: number, isTouch: boolean): void {
    if (this.reducedMotion() || this.isTransitioning()) return;
    const active = this.getActiveEntry();
    // Sección libre: no se interviene.
    if (!active?.boundaryLocked) return;

    this.commitThresholdPx = isTouch
      ? SECTION_SCROLL_CONFIG.DRAG_COMMIT_THRESHOLD_TOUCH_PX
      : SECTION_SCROLL_CONFIG.DRAG_COMMIT_THRESHOLD_PX;

    if (this.isBoundaryLocked(active)) {
      this.handleBoundaryDelta(active, dy);
    } else {
      this.handleTallSectionDelta(active, dy);
    }
  }

  /**
   * Sección bloqueada que no cabe en pantalla: scroll libre dentro, pero sus bordes hacen de muro.
   * Un gesto que empieza en un borde y empuja hacia fuera se estira igual que en una sección bloqueada;
   * uno que llega al borde a mitad de gesto se queda parado ahí, y hace falta un gesto nuevo para estirar.
   */
  private handleTallSectionDelta(active: SectionEntry, dy: number): void {
    const { atTop, atBottom } = this.getEdgeState(active);
    if (!this.gestureInProgress) {
      this.gestureInProgress = true;
      this.gestureStartedAtTop = atTop;
      this.gestureStartedAtBottom = atBottom;
    }

    if (this.edgePull !== null) {
      if ((this.gestureDistance + dy) * this.edgePull <= 0) {
        // El gesto se ha invertido: se cancela el estiramiento y vuelve el scroll libre.
        this.edgePull = null;
        this.gestureDistance = 0;
        this.bounceBack(active.element);
        this.smoothScroll.start();
        return;
      }
      this.handleBoundaryDelta(active, dy);
      return;
    }

    const edge: 1 | -1 | null = dy > 0 && atBottom ? 1 : dy < 0 && atTop ? -1 : null;
    // Un borde sin sección al otro lado (final de la página) no es un muro.
    if (edge === null || !this.getAdjacentId(edge)) {
      this.smoothScroll.start();
      return;
    }

    this.smoothScroll.stop();
    const startedAtThisEdge = edge === 1 ? this.gestureStartedAtBottom : this.gestureStartedAtTop;
    if (startedAtThisEdge) {
      this.edgePull = edge;
      this.handleBoundaryDelta(active, dy);
    }
  }

  private getEdgeState(entry: SectionEntry): { atTop: boolean; atBottom: boolean } {
    const top = this.sectionOffsets.get(entry.id) ?? entry.element.offsetTop;
    const bottomEdgeY = top + entry.element.offsetHeight - window.innerHeight;
    const y = window.scrollY;
    const eps = SECTION_SCROLL_CONFIG.TOP_EDGE_EPSILON_PX;
    return { atTop: y <= top + eps, atBottom: y >= bottomEdgeY - eps };
  }

  /** Si la inercia cruza un borde de una sección alta, se para en el borde (el muro). */
  private handleScroll(): void {
    const y = window.scrollY;
    const prev = this.lastScrollY;
    this.lastScrollY = y;

    if (this.reducedMotion() || this.isTransitioning() || this.edgePull !== null) return;
    const active = this.getActiveEntry();
    if (!active || !active.boundaryLocked || this.isBoundaryLocked(active)) return;

    const top = this.sectionOffsets.get(active.id) ?? active.element.offsetTop;
    const bottomEdgeY = top + active.element.offsetHeight - window.innerHeight;
    const eps = SECTION_SCROLL_CONFIG.TOP_EDGE_EPSILON_PX;

    if (prev <= bottomEdgeY + eps && y > bottomEdgeY + eps && this.getAdjacentId(1)) {
      this.wallAt(bottomEdgeY);
    } else if (prev >= top - eps && y < top - eps && this.getAdjacentId(-1)) {
      this.wallAt(top);
    }
  }

  private wallAt(y: number): void {
    this.smoothScroll.stop();
    this.smoothScroll.jumpTo(y);
  }

  private handleBoundaryDelta(active: SectionEntry, dy: number): void {
    this.gestureDistance += dy;

    const progressToMax = Math.min(Math.abs(this.visualOffset) / SECTION_SCROLL_CONFIG.MAX_RUBBERBAND_PX, 1);
    const resistance = SECTION_SCROLL_CONFIG.RUBBERBAND_RESISTANCE * (1 - Math.pow(progressToMax, 2) * 0.6);

    this.visualOffset = this.clamp(
      this.visualOffset + dy * resistance,
      -SECTION_SCROLL_CONFIG.MAX_RUBBERBAND_PX,
      SECTION_SCROLL_CONFIG.MAX_RUBBERBAND_PX
    );

    this.getRubberbandSetter(active.element)(-this.visualOffset);

    const pull = this.clamp(this.gestureDistance / this.commitThresholdPx, -1, 1);
    this.pullListeners.forEach((cb) => cb(pull));
  }

  private handleGestureEnd(velocityY: number): void {
    this.gestureInProgress = false;
    const edgePull = this.edgePull;
    this.edgePull = null;

    const active = this.getActiveEntry();
    const pulling = !!active && (this.isBoundaryLocked(active) || edgePull !== null);
    if (this.reducedMotion() || this.isTransitioning() || !active || !pulling) {
      this.gestureDistance = 0;
      return;
    }

    const distance = this.gestureDistance;
    this.gestureDistance = 0;

    const shouldCommit =
      Math.abs(distance) >= this.commitThresholdPx ||
      Math.abs(velocityY) >= SECTION_SCROLL_CONFIG.DRAG_COMMIT_VELOCITY;

    if (!shouldCommit) {
      this.bounceBack(active.element);
      return;
    }

    const direction = (distance !== 0 ? Math.sign(distance) : Math.sign(velocityY)) as 1 | -1;
    // Desde el borde de una sección alta solo se sale por ese borde.
    const targetId = edgePull !== null && direction !== edgePull ? null : this.getAdjacentId(direction);

    if (!targetId) {
      this.bounceBack(active.element);
      return;
    }

    const activeEl = active.element;
    gsap
      .timeline()
      .to(activeEl, { y: 0, duration: 0.15, ease: 'power1.in' })
      .call(() => {
        this.visualOffset = 0;
        this.pullListeners.forEach((cb) => cb(0));
        this.commitTransition(targetId, { alignBottom: direction === -1 });
      });
  }

  private bounceBack(el: HTMLElement): void {
    this.pullListeners.forEach((cb) => cb(0));
    gsap.to(el, {
      y: 0,
      duration: SECTION_SCROLL_CONFIG.BOUNCE_DURATION_S,
      ease: SECTION_SCROLL_CONFIG.BOUNCE_EASE,
      onComplete: () => {
        this.visualOffset = 0;
      }
    });
  }

  /**
   * alignBottom: al volver hacia arriba a una sección más alta que la pantalla, aterriza en su final
   * (donde se dejó) en vez de en su principio.
   */
  private commitTransition(targetId: string, options?: { duration?: number; alignBottom?: boolean }): void {
    if (this.isTransitioning()) return;
    const target = this.sections().find((s) => s.id === targetId);
    if (!target) return;

    this.isTransitioning.set(true);
    this.smoothScroll.stop();

    const durationS = options?.duration ?? SECTION_SCROLL_CONFIG.TRANSITION_DURATION_S;
    this.transitionListeners.forEach((cb) => cb(target.id, durationS));

    const offset =
      options?.alignBottom && this.sectionOverflowsViewport.get(target.id)
        ? target.element.offsetHeight - window.innerHeight
        : 0;

    this.smoothScroll.scrollTo(target.element, {
      force: true,
      duration: durationS,
      offset,
      onComplete: () => {
        this.isTransitioning.set(false);
        this.setActiveSection(target.id);
      }
    });
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (this.reducedMotion() || this.isTransitioning()) return;
    const active = this.getActiveEntry();
    if (!active?.boundaryLocked) return;

    const list = this.sections();
    if (list.length === 0) return;

    let direction: 1 | -1 | null = null;
    let targetId: string | undefined;
    switch (e.key) {
      case 'PageDown':
      case 'ArrowDown':
        direction = 1;
        targetId = this.getAdjacentId(1) ?? undefined;
        break;
      case 'PageUp':
      case 'ArrowUp':
        direction = -1;
        targetId = this.getAdjacentId(-1) ?? undefined;
        break;
      case 'Home':
        targetId = list[0].id;
        break;
      case 'End':
        targetId = list[list.length - 1].id;
        break;
      default:
        return;
    }

    // Sección alta: las flechas/páginas desplazan dentro con normalidad y solo saltan de sección en el borde.
    if (direction !== null && !this.isBoundaryLocked(active)) {
      const { atTop, atBottom } = this.getEdgeState(active);
      const atEdge = direction === 1 ? atBottom : atTop;
      if (!atEdge || !targetId) {
        this.smoothScroll.start();
        return;
      }
    }

    e.preventDefault();
    if (targetId && targetId !== active.id) {
      this.commitTransition(targetId, { alignBottom: direction === -1 });
    }
  }

  private getRubberbandSetter(el: HTMLElement): (value: number) => void {
    if (this.rubberbandEl !== el || !this.rubberbandSetter) {
      this.rubberbandEl = el;
      this.rubberbandSetter = gsap.quickSetter(el, 'y', 'px') as (value: number) => void;
    }
    return this.rubberbandSetter;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  destroy(): void {
    this.unsubscribeDelta?.();
    this.unsubscribeGestureEnd?.();
    if (this.keydownHandler) window.removeEventListener('keydown', this.keydownHandler);
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
    if (this.reducedMotionQuery && this.reducedMotionListener) {
      this.reducedMotionQuery.removeEventListener('change', this.reducedMotionListener);
    }
    this.triggers.forEach((t) => t.kill());
    this.triggers.clear();
    this.pullListeners.clear();
    this.transitionListeners.clear();
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
