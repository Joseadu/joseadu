import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  viewChildren
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PortfolioService } from '../shared/services/portfolio.service';
import { revealOnScroll } from '../shared/utils/reveal-on-scroll';

/** Formación e idiomas, a dos columnas. Cierra la página como su propia sección del paginado. */
@Component({
  selector: 'app-education-section',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './education-section.component.html',
  styleUrl: './education-section.component.css'
})
export class EducationSectionComponent implements AfterViewInit, OnDestroy {
  private readonly portfolioService = inject(PortfolioService);
  private readonly revealItems = viewChildren<ElementRef<HTMLElement>>('revealItem');

  readonly education = this.portfolioService.education;
  readonly languages = this.portfolioService.languages;

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
