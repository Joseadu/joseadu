import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
  viewChildren
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AboutComponent } from '../about/about.component';
import { ScrollSectionDirective } from '../shared/directives/scroll-section.directive';
import { ScrollIndicatorComponent } from '../shared/components/scroll-indicator/scroll-indicator.component';

@Component({
  selector: 'app-home',
  imports: [AboutComponent, ScrollSectionDirective, ScrollIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private readonly heroContainer = viewChild<ElementRef<HTMLElement>>('heroRef');
  private readonly aboutContainer = viewChild<ElementRef<HTMLElement>>('aboutRef');
  private readonly headingsRef = viewChild<ElementRef<HTMLElement>>('headingsRef');
  private readonly revealItems = viewChildren<ElementRef<HTMLElement>>('revealItem');

  private triggers: ScrollTrigger[] = [];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    // 1. Desvanecimiento cinemático del Hero
    const heroEl = this.heroContainer()?.nativeElement;
    const headings = this.headingsRef()?.nativeElement;
    if (heroEl && headings) {
      const heroTrigger = ScrollTrigger.create({
        trigger: heroEl,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        animation: gsap.to(headings, {
          y: -90,
          opacity: 0,
          filter: 'blur(6px)',
          ease: 'power2.inOut'
        })
      });
      this.triggers.push(heroTrigger);
    }

    // 2. Revelado en cascada de la sección Sobre mí (100vh)
    const aboutEl = this.aboutContainer()?.nativeElement;
    const revealEls = this.revealItems().map((ref) => ref.nativeElement);
    if (aboutEl && revealEls.length > 0) {
      const aboutTrigger = ScrollTrigger.create({
        trigger: aboutEl,
        start: 'top 70%',
        onEnter: () => {
          gsap.fromTo(
            revealEls,
            { opacity: 0, y: 35 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: 'power3.out',
              overwrite: 'auto'
            }
          );
        }
      });
      this.triggers.push(aboutTrigger);
    }
  }

  ngOnDestroy(): void {
    this.triggers.forEach((trigger) => trigger.kill());
  }
}
