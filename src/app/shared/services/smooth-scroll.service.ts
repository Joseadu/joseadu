import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({
  providedIn: 'root'
})
export class SmoothScrollService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private lenis: Lenis | null = null;
  private readonly updateTicker = (time: number) => {
    this.lenis?.raf(time * 1000);
  };

  init(): void {
    if (this.lenis || typeof window === 'undefined') {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    this.ngZone.runOutsideAngular(() => {
      this.lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.9, // Da esa sensación sutil de resistencia física
        touchMultiplier: 1.5
      });

      // Sincronizar Lenis con GSAP ScrollTrigger
      this.lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add(this.updateTicker);
      gsap.ticker.lagSmoothing(0);
    });
  }

  /**
   * Instancia de Lenis para consumidores que necesitan control fino (p.ej. SectionScrollService).
   */
  getLenis(): Lenis | null {
    return this.lenis;
  }

  get isStopped(): boolean {
    return this.lenis?.isStopped ?? false;
  }

  stop(): void {
    this.lenis?.stop();
  }

  start(): void {
    this.lenis?.start();
  }

  scrollTo(
    target: string | HTMLElement,
    options?: { offset?: number; duration?: number; force?: boolean; onComplete?: () => void }
  ): void {
    this.lenis?.scrollTo(target, {
      offset: options?.offset ?? 0,
      duration: options?.duration ?? 1.4,
      force: options?.force ?? false,
      onComplete: options?.onComplete
    });
  }

  /** Salto inmediato a una posición, aunque Lenis esté parado. */
  jumpTo(y: number): void {
    this.lenis?.scrollTo(y, { immediate: true, force: true });
  }

  destroy(): void {
    gsap.ticker.remove(this.updateTicker);
    this.lenis?.destroy();
    this.lenis = null;
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
