import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  viewChild
} from '@angular/core';
import { gsap } from 'gsap';
import { SectionScrollService } from '../../services/section-scroll.service';

/** Distancia (px) desde la que baja el indicador al aparecer. */
const HIDDEN_OFFSET_PX = 16;

/**
 * Indicador de "tirar hacia arriba": oculto en reposo, aparece bajo el header mientras se estira
 * hacia la sección anterior y anuncia a cuál se vuelve. Es el equivalente, hacia arriba, del ratón
 * de scroll. Global: basta una instancia, se alimenta de SectionScrollService.
 */
@Component({
  selector: 'app-pull-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pull-hint.component.html',
  styleUrl: './pull-hint.component.css',
  // Decorativo: refleja un gesto en curso; la navegación accesible está en el header y el teclado.
  host: { 'aria-hidden': 'true' }
})
export class PullHintComponent {
  private readonly sectionScroll = inject(SectionScrollService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hintRef = viewChild<ElementRef<HTMLElement>>('hint');
  private readonly arrowRef = viewChild<ElementRef<SVGElement>>('arrow');

  /** Sección a la que se vuelve al tirar hacia arriba. */
  readonly targetLabel = computed(() => this.sectionScroll.adjacentSection(-1)?.label ?? '');

  constructor() {
    afterNextRender(() => this.ngZone.runOutsideAngular(() => this.setupPull()));
  }

  private setupPull(): void {
    const hint = this.hintRef()?.nativeElement;
    const arrow = this.arrowRef()?.nativeElement;
    if (!hint || !arrow) return;

    gsap.set(hint, { y: -HIDDEN_OFFSET_PX });
    const setY = gsap.quickTo(hint, 'y', { duration: 0.2, ease: 'power2.out' });
    const setOpacity = gsap.quickTo(hint, 'opacity', { duration: 0.2, ease: 'power2.out' });
    let ready = false;

    const off = this.sectionScroll.onPull((pull) => {
      // Solo hacia arriba (pull < 0) y si hay sección a la que volver.
      const progress = this.targetLabel() ? Math.max(-pull, 0) : 0;
      // Se hace visible pronto, antes del umbral, para que se entienda qué va a pasar.
      setOpacity(Math.min(progress * 1.5, 1));
      setY(-HIDDEN_OFFSET_PX * (1 - progress));

      // pull llega recortado a ±1: 1 = umbral alcanzado, soltar ya cambia de sección.
      const isReady = progress >= 1;
      if (isReady !== ready) {
        ready = isReady;
        hint.classList.toggle('is-ready', ready);
        if (ready) {
          gsap.fromTo(arrow, { scale: 1 }, { scale: 1.3, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 });
        }
      }
    });

    this.destroyRef.onDestroy(off);
  }
}
