import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  NgZone,
  viewChild
} from '@angular/core';
import { gsap } from 'gsap';
import { SectionScrollService } from '../../services/section-scroll.service';

@Component({
  selector: 'app-scroll-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-indicator.component.html',
  styleUrl: './scroll-indicator.component.css'
})
export class ScrollIndicatorComponent {
  readonly target = input.required<string>();
  readonly label = input('Scroll para explorar');
  readonly variant = input<'down' | 'up'>('down');
  /** En vez de ir fijo al fondo de la sección, fluye en el documento: para secciones que en móvil
   *  dejan de ser 100vh, donde la posición absoluta acabaría solapando el contenido. */
  readonly inline = input(false);

  private readonly sectionScroll = inject(SectionScrollService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly iconRef = viewChild<ElementRef<HTMLElement>>('icon');

  constructor() {
    afterNextRender(() => this.ngZone.runOutsideAngular(() => this.setupPullStretch()));
  }

  handleClick(): void {
    this.sectionScroll.goToSection(this.target());
  }

  private setupPullStretch(): void {
    const icon = this.iconRef()?.nativeElement;
    if (!icon) return;

    const setStretch = gsap.quickTo(icon, 'scaleY', { duration: 0.2, ease: 'power2.out' });
    const setSqueeze = gsap.quickTo(icon, 'scaleX', { duration: 0.2, ease: 'power2.out' });

    // El icono solo se estira cuando el tirón va en su propio sentido: el de abajo con pull > 0, el de subir con pull < 0.
    const sign = this.variant() === 'down' ? 1 : -1;

    const off = this.sectionScroll.onPull((pull) => {
      const stretch = Math.max(pull * sign, 0);
      setStretch(1 + stretch * 0.6);
      setSqueeze(1 - stretch * 0.25);
      // pull llega recortado a ±1: 1 = umbral alcanzado, soltar ya cambia de sección.
      this.host.nativeElement.classList.toggle('is-ready', stretch >= 1);
    });

    this.destroyRef.onDestroy(off);
  }
}
