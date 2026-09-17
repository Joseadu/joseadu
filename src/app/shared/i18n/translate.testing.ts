import { Provider } from '@angular/core';
import { provideTranslateService, TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { DEFAULT_LANGUAGE } from './language.config';

/** Devuelve traducciones vacías: un test no debe depender de descargar los JSON ni de su contenido. */
class EmptyTranslateLoader implements TranslateLoader {
  getTranslation(): Observable<TranslationObject> {
    return of({});
  }
}

/**
 * Providers de i18n para tests. Cualquier componente que use el pipe `translate`, o cualquier
 * servicio que dependa de LanguageService, los necesita: sin ellos el TestBed falla al inyectar
 * TranslateService.
 */
export function provideTranslateTesting(): Provider[] {
  return provideTranslateService({
    loader: EmptyTranslateLoader,
    fallbackLang: DEFAULT_LANGUAGE
  });
}
