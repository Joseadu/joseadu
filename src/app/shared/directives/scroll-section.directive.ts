import { afterNextRender, Directive, ElementRef, inject, Injector, input, DestroyRef } from '@angular/core';
import { SectionScrollService } from '../services/section-scroll.service';

/**
 * Marca un elemento como "sección" del scroll paginado con resistencia.
 * Se auto-registra en SectionScrollService y se desregistra al destruirse.
 *
 * @example
 * <section appScrollSection="hero" sectionLabel="Inicio">...</section>
 * <!-- Sin paginado: scroll totalmente libre -->
 * <div appScrollSection="free" [boundaryLocked]="false">...</div>
 */
@Directive({
  selector: '[appScrollSection]'
})
export class ScrollSectionDirective {
  readonly id = input.required<string>({ alias: 'appScrollSection' });
  readonly boundaryLocked = input(true);
  /** Nombre legible de la sección (p.ej. para el indicador de tirar hacia arriba). */
  readonly sectionLabel = input<string>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly sectionScroll = inject(SectionScrollService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(
      () => {
        const id = this.id();
        this.sectionScroll.registerSection({
          id,
          element: this.elementRef.nativeElement,
          boundaryLocked: this.boundaryLocked(),
          label: this.sectionLabel
        });
        this.destroyRef.onDestroy(() => this.sectionScroll.unregisterSection(id));
      },
      { injector: this.injector }
    );
  }
}
