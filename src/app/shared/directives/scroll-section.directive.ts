import { afterNextRender, Directive, ElementRef, inject, Injector, input, DestroyRef } from '@angular/core';
import { SectionScrollService } from '../services/section-scroll.service';

/**
 * Marca un elemento como "sección" del scroll paginado con resistencia.
 * Se auto-registra en SectionScrollService y se desregistra al destruirse.
 *
 * @example
 * <section appScrollSection="hero">...</section>
 * <div appScrollSection="experience" [boundaryLocked]="false">...</div>
 */
@Directive({
  selector: '[appScrollSection]'
})
export class ScrollSectionDirective {
  readonly id = input.required<string>({ alias: 'appScrollSection' });
  readonly boundaryLocked = input(true);

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
          boundaryLocked: this.boundaryLocked()
        });
        this.destroyRef.onDestroy(() => this.sectionScroll.unregisterSection(id));
      },
      { injector: this.injector }
    );
  }
}
