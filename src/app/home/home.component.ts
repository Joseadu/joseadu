import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AboutComponent } from '../about/about.component';
import { SmoothScrollService } from '../shared/services/smooth-scroll.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, AboutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private readonly smoothScroll = inject(SmoothScrollService);
  private readonly heroContainer = viewChild<ElementRef<HTMLElement>>('heroRef');
  private readonly aboutContainer = viewChild<ElementRef<HTMLElement>>('aboutRef');

  private triggers: ScrollTrigger[] = [];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Resistencia y desvanecimiento cinemático del Hero
    const heroEl = this.heroContainer()?.nativeElement;
    if (heroEl) {
      const headings = heroEl.querySelector('.headings');
      const scrollIndicator = heroEl.querySelector('.scroll-indicator');

      if (headings) {
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

      if (scrollIndicator) {
        const indicatorTrigger = ScrollTrigger.create({
          trigger: heroEl,
          start: 'top top',
          end: '25% top',
          scrub: true,
          animation: gsap.to(scrollIndicator, {
            opacity: 0,
            y: -20,
            ease: 'power1.out'
          })
        });
        this.triggers.push(indicatorTrigger);
      }
    }

    // 2. Transición y revelado en cascada de la sección Sobre mí (100vh)
    const aboutEl = this.aboutContainer()?.nativeElement;
    if (aboutEl) {
      const revealItems = aboutEl.querySelectorAll('.reveal-item');
      if (revealItems.length > 0) {
        const aboutTrigger = ScrollTrigger.create({
          trigger: aboutEl,
          start: 'top 70%',
          onEnter: () => {
            gsap.fromTo(
              revealItems,
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

      const aboutIndicator = aboutEl.querySelector('.scroll-indicator');
      if (aboutIndicator) {
        const aboutIndicatorTrigger = ScrollTrigger.create({
          trigger: aboutEl,
          start: 'top top',
          end: '30% top',
          scrub: true,
          animation: gsap.to(aboutIndicator, {
            opacity: 0,
            y: -20,
            ease: 'power1.out'
          })
        });
        this.triggers.push(aboutIndicatorTrigger);
      }
    }
  }

  scrollTo(target: string): void {
    this.smoothScroll.scrollTo(target);
  }

  ngOnDestroy(): void {
    this.triggers.forEach((trigger) => trigger.kill());
  }
}
