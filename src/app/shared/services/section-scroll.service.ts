import { inject, Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SmoothScrollService } from './smooth-scroll.service';
import { ScrollGestureService } from './scroll-gesture.service';
import { SECTION_SCROLL_CONFIG } from './scroll-section.config';

export interface SectionEntry {
  id: string;
  element: HTMLElement;
  /** true = sección de 100vh paginada con resistencia (hero, about). false = contenido libre (experience). */
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

  // Re-entry al subir desde el borde superior de una sección libre (experience).
  private edgeAccum = 0;

  private ensureInit(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }
    this.initialized = true;

    this.scrollGesture.init();
    this.setupReducedMotion();

    this.ngZone.runOutsideAngular(() => {
      this.unsubscribeDelta = this.scrollGesture.onDelta((dy, velocityY) => this.handleDelta(dy, velocityY));
      this.unsubscribeGestureEnd = this.scrollGesture.onGestureEnd((velocityY) => this.handleGestureEnd(velocityY));

      this.keydownHandler = (e) => this.handleKeydown(e);
      window.addEventListener('keydown', this.keydownHandler);

      let resizeTimeout: ReturnType<typeof setTimeout>;
      this.resizeHandler = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => this.recalculate(), 150);
      };
      window.addEventListener('resize', this.resizeHandler);
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
    this.commitTransition(id, opts?.duration);
  }

  recalculate(): void {
    this.sections().forEach((s) => this.sectionOffsets.set(s.id, s.element.offsetTop));
    ScrollTrigger.refresh();
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

    if (entry.boundaryLocked) {
      this.smoothScroll.stop();
    } else {
      this.smoothScroll.start();
    }
  }

  private handleDelta(dy: number, velocityY: number): void {
    if (this.reducedMotion() || this.isTransitioning()) return;
    const active = this.getActiveEntry();
    if (!active) return;

    if (active.boundaryLocked) {
      this.handleBoundaryDelta(active, dy);
    } else {
      this.handleEdgeDelta(active, dy, velocityY);
    }
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

    const pull = this.clamp(this.gestureDistance / SECTION_SCROLL_CONFIG.DRAG_COMMIT_THRESHOLD_PX, -1, 1);
    this.pullListeners.forEach((cb) => cb(pull));
  }

  private handleEdgeDelta(active: SectionEntry, dy: number, velocityY: number): void {
    const offsetTop = this.sectionOffsets.get(active.id) ?? active.element.offsetTop;
    const atTopEdge = window.scrollY <= offsetTop + SECTION_SCROLL_CONFIG.TOP_EDGE_EPSILON_PX;

    if (!atTopEdge || dy >= 0) {
      this.edgeAccum = 0;
      return;
    }

    this.edgeAccum += dy;

    const shouldReenter =
      Math.abs(this.edgeAccum) >= SECTION_SCROLL_CONFIG.EDGE_REENTRY_PX ||
      Math.abs(velocityY) >= SECTION_SCROLL_CONFIG.EDGE_REENTRY_VELOCITY;

    if (shouldReenter) {
      this.edgeAccum = 0;
      const prevId = this.getAdjacentId(-1);
      if (prevId) this.commitTransition(prevId);
    }
  }

  private handleGestureEnd(velocityY: number): void {
    this.edgeAccum = 0;

    const active = this.getActiveEntry();
    if (this.reducedMotion() || this.isTransitioning() || !active?.boundaryLocked) {
      this.gestureDistance = 0;
      return;
    }

    const distance = this.gestureDistance;
    this.gestureDistance = 0;

    const shouldCommit =
      Math.abs(distance) >= SECTION_SCROLL_CONFIG.DRAG_COMMIT_THRESHOLD_PX ||
      Math.abs(velocityY) >= SECTION_SCROLL_CONFIG.DRAG_COMMIT_VELOCITY;

    if (!shouldCommit) {
      this.bounceBack(active.element);
      return;
    }

    const direction = (distance !== 0 ? Math.sign(distance) : Math.sign(velocityY)) as 1 | -1;
    const targetId = this.getAdjacentId(direction);

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
        this.commitTransition(targetId);
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

  private commitTransition(targetId: string, duration?: number): void {
    if (this.isTransitioning()) return;
    const target = this.sections().find((s) => s.id === targetId);
    if (!target) return;

    this.isTransitioning.set(true);
    this.smoothScroll.stop();

    const durationS = duration ?? SECTION_SCROLL_CONFIG.TRANSITION_DURATION_S;
    this.transitionListeners.forEach((cb) => cb(target.id, durationS));

    this.smoothScroll.scrollTo(target.element, {
      force: true,
      duration: durationS,
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

    switch (e.key) {
      case 'PageDown':
      case 'ArrowDown': {
        e.preventDefault();
        const id = this.getAdjacentId(1);
        if (id) this.commitTransition(id);
        break;
      }
      case 'PageUp':
      case 'ArrowUp': {
        e.preventDefault();
        const id = this.getAdjacentId(-1);
        if (id) this.commitTransition(id);
        break;
      }
      case 'Home':
        e.preventDefault();
        this.commitTransition(list[0].id);
        break;
      case 'End':
        e.preventDefault();
        this.commitTransition(list[list.length - 1].id);
        break;
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
