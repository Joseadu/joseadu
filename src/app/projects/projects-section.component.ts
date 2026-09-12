import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  viewChildren
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PortfolioService } from '../shared/services/portfolio.service';
import { revealOnScroll } from '../shared/utils/reveal-on-scroll';

/**
 * Rejilla de proyectos: cada tarjeta enseña la captura del proyecto y, al pasar el ratón
 * (o al enfocar con teclado), descubre la ficha. En pantallas táctiles, donde no hay hover,
 * la ficha se muestra siempre bajo la imagen.
 */
@Component({
  selector: 'app-projects-section',
  imports: [TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-section.component.html',
  styleUrl: './projects-section.component.css'
})
export class ProjectsSectionComponent implements AfterViewInit, OnDestroy {
  private readonly portfolioService = inject(PortfolioService);
  private readonly revealItems = viewChildren<ElementRef<HTMLElement>>('revealItem');

  readonly projects = this.portfolioService.projects;

  private triggers: ScrollTrigger[] = [];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const items = this.revealItems().map((ref) => ref.nativeElement);
    this.triggers = revealOnScroll(items);
  }

  ngOnDestroy(): void {
    this.triggers.forEach((trigger) => trigger.kill());
  }
}
