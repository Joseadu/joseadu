import { inject, Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { SECTION_SCROLL_CONFIG } from './scroll-section.config';

type DeltaCallback = (deltaY: number, velocityY: number) => void;
type GestureEndCallback = (velocityY: number) => void;

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
          this.deltaCallbacks.forEach((cb) => cb(self.deltaY, self.velocityY));
        },
        onStop: (self) => {
          this.isGestureActive.set(false);
          this.gestureEndCallbacks.forEach((cb) => cb(self.velocityY));
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
