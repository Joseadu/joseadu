import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  viewChildren
} from '@angular/core';
import { gsap } from 'gsap';
import { SectionScrollService } from '../../services/section-scroll.service';
import {
  DEFAULT_GLOW_COMPOSITION,
  GLOW_COMPOSITIONS,
  GLOW_CONFIG,
  GlowComposition
} from './glow-background.config';

/**
 * Luces ambientales persistentes. Cada luz tiene tres capas para que las animaciones no se pisen:
 * anchor (GSAP: composición de la sección) > pull (GSAP: reacción al tirón) > blob (CSS: deriva continua).
 */
@Component({
  selector: 'app-glow-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './glow-background.component.html',
  styleUrl: './glow-background.component.css'
})
export class GlowBackgroundComponent {
  protected readonly glows = [1, 2];

  private readonly anchorRefs = viewChildren<ElementRef<HTMLElement>>('anchor');
  private readonly pullRefs = viewChildren<ElementRef<HTMLElement>>('pull');
  private readonly sectionScroll = inject(SectionScrollService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private currentId: string | null = null;
  private travelTweens: gsap.core.Tween[] = [];

  constructor() {
    afterNextRender(() => this.ngZone.runOutsideAngular(() => this.setup()));
  }

  private setup(): void {
    const anchors = this.anchorRefs().map((ref) => ref.nativeElement);
    const pulls = this.pullRefs().map((ref) => ref.nativeElement);

    this.applyComposition(anchors, DEFAULT_GLOW_COMPOSITION);

    const follow = { duration: GLOW_CONFIG.PULL_FOLLOW_DURATION_S, ease: 'power3.out' };
    const pullSetters = pulls.map((el) => ({
      y: gsap.quickTo(el, 'y', follow),
      scaleX: gsap.quickTo(el, 'scaleX', follow),
      scaleY: gsap.quickTo(el, 'scaleY', follow)
    }));

    // Las luces acompañan al contenido y se estiran: la tensión crece hasta el umbral de commit.
    const setPull = (progress: number) => {
      const stretch = Math.abs(progress) * (GLOW_CONFIG.PULL_MAX_STRETCH - 1);
      pullSetters.forEach((setter) => {
        setter.y(-progress * GLOW_CONFIG.PULL_MAX_OFFSET_PX);
        setter.scaleY(1 + stretch);
        setter.scaleX(1 - stretch * 0.4);
      });
    };

    const offPull = this.sectionScroll.onPull((progress) => {
      if (!this.prefersReducedMotion()) setPull(progress);
    });

    const offTransition = this.sectionScroll.onTransition((id, durationS) => {
      setPull(0);
      this.travelTo(anchors, id, durationS);
    });

    const onResize = () => {
      this.killTravel();
      this.applyComposition(anchors, this.compositionFor(this.currentId));
    };
    window.addEventListener('resize', onResize);

    this.destroyRef.onDestroy(() => {
      offPull();
      offTransition();
      window.removeEventListener('resize', onResize);
      this.killTravel();
    });
  }

  private travelTo(anchors: HTMLElement[], id: string, durationS: number): void {
    if (id === this.currentId) return;
    this.currentId = id;
    this.killTravel();

    const composition = this.compositionFor(id);
    if (durationS === 0 || this.prefersReducedMotion()) {
      this.applyComposition(anchors, composition);
      return;
    }

    anchors.forEach((el, i) => {
      const pose = composition[i];
      const fromX = gsap.getProperty(el, 'x') as number;
      const fromY = gsap.getProperty(el, 'y') as number;
      const dx = pose.x * window.innerWidth - fromX;
      const dy = pose.y * window.innerHeight - fromY;
      const distance = Math.hypot(dx, dy) || 1;

      // Arco perpendicular a la trayectoria, en sentidos opuestos para que las luces giren una alrededor de la otra.
      const bulge = distance * GLOW_CONFIG.ARC_FACTOR * (i % 2 === 0 ? 1 : -1);
      const normalX = -dy / distance;
      const normalY = dx / distance;

      const setX = gsap.quickSetter(el, 'x', 'px') as (value: number) => void;
      const setY = gsap.quickSetter(el, 'y', 'px') as (value: number) => void;
      const progress = { t: 0 };

      this.travelTweens.push(
        gsap.to(progress, {
          t: 1,
          duration: durationS,
          ease: GLOW_CONFIG.TRAVEL_EASE,
          onUpdate: () => {
            const arc = Math.sin(Math.PI * progress.t) * bulge;
            setX(fromX + dx * progress.t + normalX * arc);
            setY(fromY + dy * progress.t + normalY * arc);
          }
        }),
        gsap.to(el, {
          scale: pose.scale,
          opacity: pose.opacity,
          duration: durationS,
          ease: GLOW_CONFIG.SETTLE_EASE
        })
      );
    });
  }

  private applyComposition(anchors: HTMLElement[], composition: GlowComposition): void {
    anchors.forEach((el, i) => {
      const pose = composition[i];
      gsap.set(el, {
        x: pose.x * window.innerWidth,
        y: pose.y * window.innerHeight,
        scale: pose.scale,
        opacity: pose.opacity
      });
    });
  }

  private compositionFor(id: string | null): GlowComposition {
    return (id && GLOW_COMPOSITIONS[id]) || DEFAULT_GLOW_COMPOSITION;
  }

  private killTravel(): void {
    this.travelTweens.forEach((tween) => tween.kill());
    this.travelTweens = [];
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
