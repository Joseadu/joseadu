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
  /**
   * Dedo/puntero apoyado, llevado por nosotros con onPress/onRelease. No vale self.isDragging: al soltar,
   * Observer lo pone a false ANTES de entregar el último delta pendiente, y ese delta llegaría como si
   * fuera de rueda (signo al revés y umbral de rueda justo antes de decidir el cambio de sección).
   * onRelease se llama después de ese último delta, así que este flag sigue activo cuando llega.
   */
  private pointerDown = false;
  /** Tipo del último delta, para el fin de gesto (onStop llega cuando ya se ha soltado). */
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
        onPress: () => {
          this.pointerDown = true;
        },
        onRelease: () => {
          this.pointerDown = false;
        },
        onChangeY: (self) => {
          this.isGestureActive.set(true);
          this.velocityY.set(self.velocityY);
          // Observer no normaliza el signo del touch/pointer como el de la rueda: deltaY de un
          // arrastre es el movimiento crudo del dedo (deslizar hacia arriba da negativo), mientras
          // que en wheel positivo ya significa "scroll hacia abajo". Sin invertir, el swipe en
          // móvil queda al revés de lo esperado.
          const isTouch = this.pointerDown;
          this.lastWasDragging = isTouch;
          const dy = isTouch ? -self.deltaY : self.deltaY;
          this.deltaCallbacks.forEach((cb) => cb(dy, self.velocityY, isTouch));
        },
        onStop: (self) => {
          this.isGestureActive.set(false);
          // Ya se ha soltado aquí; usamos el tipo del último delta para invertir la velocidad igual que deltaY.
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
