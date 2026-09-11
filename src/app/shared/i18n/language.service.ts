import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY
} from './language.config';

/**
 * Idioma de la app: envuelve TranslateService para decidir el idioma inicial, recordar la
 * preferencia y mantener `<html lang>` sincronizado. El cambio es en caliente (sin recargar).
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  /** Idioma activo; cambia cuando las traducciones del nuevo idioma ya están cargadas. */
  readonly current = computed<AppLanguage>(() => {
    const lang = this.translate.currentLang();
    return isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  });

  constructor() {
    // Accesibilidad (lectores de pantalla) y evita que el navegador ofrezca traducir la página.
    effect(() => {
      this.document.documentElement.lang = this.current();
    });
  }

  /** Para APP_INITIALIZER: la app no se pinta hasta tener las traducciones (sin parpadeo de claves). */
  init(): Observable<unknown> {
    return this.translate.use(this.resolveInitialLanguage());
  }

  setLanguage(lang: AppLanguage): void {
    if (lang === this.current()) return;
    this.storeLanguage(lang);
    // TranslateService.use() ya se suscribe internamente para cargar el idioma.
    this.translate.use(lang);
  }

  /** Preferencia guardada > idioma del navegador > idioma por defecto. */
  private resolveInitialLanguage(): AppLanguage {
    const stored = this.readStoredLanguage();
    if (stored) return stored;
    const browser = this.translate.getBrowserLang();
    return isSupportedLanguage(browser) ? browser : DEFAULT_LANGUAGE;
  }

  // localStorage puede lanzar (navegación privada en algunos navegadores, cookies bloqueadas):
  // la preferencia es una comodidad, así que si falla se ignora.
  private readStoredLanguage(): AppLanguage | null {
    try {
      const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return isSupportedLanguage(value) ? value : null;
    } catch {
      return null;
    }
  }

  private storeLanguage(lang: AppLanguage): void {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Sin persistencia: el idioma se mantiene durante la visita.
    }
  }
}
