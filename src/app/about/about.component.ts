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

/** Trayectoria profesional en formato timeline. */
@Component({
    selector: 'app-about',
    imports: [TranslatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './about.component.html',
    styleUrl: './about.component.css'
})
export class AboutComponent implements AfterViewInit, OnDestroy {
    private readonly portfolioService = inject(PortfolioService);
    private readonly revealItems = viewChildren<ElementRef<HTMLElement>>('revealItem');

    readonly experiences = this.portfolioService.experiences;

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
