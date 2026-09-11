import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  viewChildren
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PortfolioService } from '../shared/services/portfolio.service';

@Component({
    selector: 'app-about',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './about.component.html',
    styleUrl: './about.component.css'
})
export class AboutComponent implements AfterViewInit, OnDestroy {
    private readonly portfolioService = inject(PortfolioService);
    private readonly revealItems = viewChildren<ElementRef<HTMLElement>>('revealItem');

    readonly experiences = this.portfolioService.experiences;
    readonly education = this.portfolioService.education;
    readonly languages = this.portfolioService.languages;

    private triggers: ScrollTrigger[] = [];

    ngAfterViewInit(): void {
        if (typeof window === 'undefined') return;

        const items = this.revealItems().map((ref) => ref.nativeElement);
        if (items.length === 0) return;

        // Ocultos desde el inicio: si no, se ven, desaparecen de golpe al entrar y luego hacen el fade-in.
        gsap.set(items, { opacity: 0, y: 30 });

        // batch en vez de un único ScrollTrigger: la lista es más alta que la pantalla,
        // así cada tarjeta aparece al entrar en vista (agrupando las que llegan a la vez).
        this.triggers = ScrollTrigger.batch(items, {
            start: 'top 85%',
            onEnter: (batch) =>
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    stagger: 0.12,
                    ease: 'power3.out',
                    overwrite: 'auto'
                })
        });
    }

    ngOnDestroy(): void {
        this.triggers.forEach((trigger) => trigger.kill());
    }
}
