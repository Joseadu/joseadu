export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Idioma si no hay preferencia guardada ni el navegador pide uno soportado. */
export const DEFAULT_LANGUAGE: AppLanguage = 'es';

export const LANGUAGE_STORAGE_KEY = 'joseadu.lang';

/** Un valor por idioma: para contenido estructurado que no va en los JSON de traducción. */
export type Localized<T> = Record<AppLanguage, T>;

export function isSupportedLanguage(value: unknown): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}
