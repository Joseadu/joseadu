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
  private rafId: number | null = null;

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

      const updateTicker = (time: number) => {
        this.lenis?.raf(time * 1000);
      };

      gsap.ticker.add(updateTicker);
      gsap.ticker.lagSmoothing(0);

      // Loop de animación RAF
      const raf = (time: number) => {
        this.lenis?.raf(time);
        this.rafId = requestAnimationFrame(raf);
      };
      this.rafId = requestAnimationFrame(raf);
    });
  }

  scrollTo(target: string | HTMLElement, options?: { offset?: number; duration?: number }): void {
    this.lenis?.scrollTo(target, {
      offset: options?.offset ?? 0,
      duration: options?.duration ?? 1.4
    });
  }

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lenis?.destroy();
    this.lenis = null;
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
