import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { gsap } from 'gsap';
import { CONTACT } from '../shared/data/contact.data';
import { AppLanguage, SUPPORTED_LANGUAGES } from '../shared/i18n/language.config';
import { LanguageService } from '../shared/i18n/language.service';
import { ScrollGestureService } from '../shared/services/scroll-gesture.service';
import { SectionScrollService } from '../shared/services/section-scroll.service';
import { SmoothScrollService } from '../shared/services/smooth-scroll.service';

/** Secciones que aparecen en el menú, en el orden de la página. El logo ya lleva al inicio. */
const NAV_SECTIONS = [
  { id: 'about', label: 'nav.about' },
  { id: 'experience', label: 'nav.experience' },
  { id: 'projects', label: 'nav.projects' },
  { id: 'education', label: 'nav.education' },
  { id: 'contact', label: 'nav.contact' }
] as const;

@Component({
    selector: 'app-main-nav',
    imports: [TranslatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './main-nav.component.html',
    styleUrl: './main-nav.component.css',
    host: {
        '(document:keydown.escape)': 'closeMenu()'
    }
})
export class MainNavComponent {
    private readonly sectionScroll = inject(SectionScrollService);
    private readonly smoothScroll = inject(SmoothScrollService);
    private readonly scrollGesture = inject(ScrollGestureService);
    private readonly languageService = inject(LanguageService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    private readonly toggleRef = viewChild<ElementRef<HTMLButtonElement>>('menuToggle');
    private readonly panelRef = viewChild<ElementRef<HTMLElement>>('menuPanel');
    private readonly menuItems = viewChildren<ElementRef<HTMLElement>>('menuItem');

    readonly sections = NAV_SECTIONS;
    readonly languages = SUPPORTED_LANGUAGES;
    readonly currentLanguage = this.languageService.current;
    readonly activeSectionId = this.sectionScroll.activeSectionId;
    readonly contact = CONTACT;
    readonly cvUrl = computed(() => CONTACT.cv[this.currentLanguage()]);
    readonly isMenuOpen = signal(false);

    /** Lenis puede estar ya parado por el paginado: hay que devolverlo a como estaba, no arrancarlo. */
    private scrollWasStopped = false;

    constructor() {
        this.destroyRef.onDestroy(() => {
            if (this.isMenuOpen()) this.releaseScroll();
        });
    }

    navigateTo(id: string): void {
        this.closeMenu();

        if (this.router.url === '/' || this.router.url === '') {
            this.sectionScroll.goToSection(id);
            return;
        }

        this.router.navigate(['/']).then(() => {
            this.sectionScroll.whenSectionReady(id).then(() => this.sectionScroll.goToSection(id));
        });
    }

    setLanguage(lang: AppLanguage): void {
        this.languageService.setLanguage(lang);
    }

    toggleMenu(): void {
        this.isMenuOpen() ? this.closeMenu() : this.openMenu();
    }

    closeMenu(): void {
        if (!this.isMenuOpen()) return;
        this.isMenuOpen.set(false);
        this.releaseScroll();
        // Quien abrió el menú con teclado debe volver al botón, no al principio de la página.
        this.toggleRef()?.nativeElement.focus();
    }

    /** Mantiene el foco dentro del panel mientras está abierto. */
    handlePanelKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Tab') return;

        const focusables = this.getFocusableItems();
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    private openMenu(): void {
        this.isMenuOpen.set(true);

        // El fondo no debe moverse ni estirarse mientras el menú tapa la página.
        this.scrollWasStopped = this.smoothScroll.isStopped;
        this.smoothScroll.stop();
        this.scrollGesture.disable();

        // afterNextRender no vale aquí: el panel se crea al cambiar la signal, ya en esta ronda.
        queueMicrotask(() => {
            this.revealItems();
            this.getFocusableItems()[0]?.focus();
        });
    }

    private releaseScroll(): void {
        this.scrollGesture.enable();
        if (!this.scrollWasStopped) this.smoothScroll.start();
    }

    private revealItems(): void {
        if (this.sectionScroll.reducedMotion()) return;

        const items = this.menuItems().map((ref) => ref.nativeElement);
        if (items.length === 0) return;

        gsap.fromTo(
            items,
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.06, overwrite: true }
        );
    }

    private getFocusableItems(): HTMLElement[] {
        const panel = this.panelRef()?.nativeElement;
        if (!panel) return [];
        return Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
    }
}
