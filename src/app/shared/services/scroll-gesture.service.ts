import { inject, Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { SECTION_SCROLL_CONFIG } from './scroll-section.config';

/** isTouch: el gesto es un arrastre (dedo/puntero), cuyas distancias no equivalen a las de la rueda. */
type DeltaCallback = (deltaY: number, velocityY: number, isTouch: boolean) => void;
type GestureEndCallback = (velocityY: number, isTouch: boolean) => void;

/**
 * Wrapper fino sobre gsap/Observer: normaliza wheel/touch/pointer y expone
 * el delta de cada tick y el fin de gesto. No conoce el concepto de "sección".
 */
@Injectable({
  providedIn: 'root'
})
export class ScrollGestureService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private observer: Observer | null = null;
  private readonly deltaCallbacks = new Set<DeltaCallback>();
  private readonly gestureEndCallbacks = new Set<GestureEndCallback>();

  readonly velocityY = signal(0);
  readonly isGestureActive = signal(false);
  /** self.isDragging ya vuelve a false para cuando onStop dispara, así que lo recordamos del último tick. */
  private lastWasDragging = false;

  init(): void {
    if (this.observer || typeof window === 'undefined') {
      return;
    }

    gsap.registerPlugin(Observer);

    this.ngZone.runOutsideAngular(() => {
      this.observer = Observer.create({
        target: window,
        type: 'wheel,touch,pointer',
        // No bloqueamos el scroll nativo aquí: Observer solo observa/mide el gesto.
        // El bloqueo real (paginado) lo hace SmoothScrollService.stop() vía Lenis,
        // que ya previene el scroll nativo cuando está detenido (wheel y touch).
        preventDefault: false,
        onStopDelay: SECTION_SCROLL_CONFIG.GESTURE_STOP_DELAY_S,
        onChangeY: (self) => {
          this.isGestureActive.set(true);
          this.velocityY.set(self.velocityY);
          // Observer no normaliza el signo del touch/pointer como el de la rueda: deltaY de un
          // arrastre es el movimiento crudo del dedo (deslizar hacia arriba da negativo), mientras
          // que en wheel positivo ya significa "scroll hacia abajo". Sin invertir, el swipe en
          // móvil queda al revés de lo esperado.
          this.lastWasDragging = self.isDragging;
          const dy = self.isDragging ? -self.deltaY : self.deltaY;
          this.deltaCallbacks.forEach((cb) => cb(dy, self.velocityY, self.isDragging));
        },
        onStop: (self) => {
          this.isGestureActive.set(false);
          // self.isDragging ya está en false aquí (se resetea en el release); usamos lo que
          // recordamos del último tick para invertir la velocidad igual que hicimos con deltaY.
          const velocityY = this.lastWasDragging ? -self.velocityY : self.velocityY;
          this.gestureEndCallbacks.forEach((cb) => cb(velocityY, this.lastWasDragging));
        }
      });
    });
  }

  onDelta(cb: DeltaCallback): () => void {
    this.deltaCallbacks.add(cb);
    return () => this.deltaCallbacks.delete(cb);
  }

  onGestureEnd(cb: GestureEndCallback): () => void {
    this.gestureEndCallbacks.add(cb);
    return () => this.gestureEndCallbacks.delete(cb);
  }

  /** Dedo/puntero apoyado ahora mismo (aunque esté quieto). */
  get isPressed(): boolean {
    return this.observer?.isPressed ?? false;
  }

  enable(): void {
    this.observer?.enable();
  }

  disable(): void {
    this.observer?.disable();
  }

  destroy(): void {
    this.observer?.kill();
    this.observer = null;
    this.deltaCallbacks.clear();
    this.gestureEndCallbacks.clear();
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
