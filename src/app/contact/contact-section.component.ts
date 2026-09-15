import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChildren
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CONTACT } from '../shared/data/contact.data';
import { LanguageService } from '../shared/i18n/language.service';
import { revealOnScroll } from '../shared/utils/reveal-on-scroll';

/** Cuánto se mantiene el aviso de copiado antes de volver al texto normal. */
const COPIED_FEEDBACK_MS = 2000;

/**
 * Cierre de la página: correo, enlaces personales y CV.
 *
 * El correo se enseña escrito y se copia al pulsar, en vez de depender solo de `mailto:`, que en
 * escritorio abre un cliente que mucha gente no usa y deja la conversación en vía muerta. El
 * `mailto:` se mantiene como opción secundaria.
 */
@Component({
  selector: 'app-contact-section',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-section.component.html',
  styleUrl: './contact-section.component.css'
})
export class ContactSectionComponent implements AfterViewInit, OnDestroy {
  private readonly language = inject(LanguageService);
  private readonly revealItems = viewChildren<ElementRef<HTMLElement>>('revealItem');

  readonly contact = CONTACT;
  /** El CV se sirve en el idioma que se esté viendo. */
  readonly cvUrl = computed(() => CONTACT.cv[this.language.current()]);
  readonly copied = signal(false);

  private copiedTimeout: ReturnType<typeof setTimeout> | undefined;
  private triggers: ScrollTrigger[] = [];

  async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      this.copied.set(true);
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = setTimeout(() => this.copied.set(false), COPIED_FEEDBACK_MS);
    } catch {
      // El portapapeles puede estar bloqueado (contexto no seguro, permiso denegado). El correo
      // sigue visible para copiarlo a mano y el enlace de abajo sigue funcionando.
    }
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const items = this.revealItems().map((ref) => ref.nativeElement);
    this.triggers = revealOnScroll(items);
  }

  ngOnDestroy(): void {
    clearTimeout(this.copiedTimeout);
    this.triggers.forEach((trigger) => trigger.kill());
  }
}
