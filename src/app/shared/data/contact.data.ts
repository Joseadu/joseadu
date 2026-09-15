import { Localized } from '../i18n/language.config';

/**
 * Datos de contacto y enlaces personales, en un solo sitio para poder cambiarlos sin tocar la vista.
 *
 * Los CV son ficheros estáticos: viven en `src/assets/cv/` y se sirven como `assets/cv/x.pdf`.
 * El nombre del fichero acaba en la carpeta de descargas de quien te evalúa, así que conviene
 * que se explique solo.
 */
export const CONTACT = {
  /** TODO: sustituir por el correo que quieras publicar. */
  email: 'hola@joseadu.com',
  linkedin: 'https://www.linkedin.com/in/josea-du',
  github: 'https://github.com/Joseadu',
  /** TODO: falta el PDF en inglés; hasta que esté en src/assets/cv/, ese botón dará 404. */
  cv: {
    es: 'assets/cv/Jose-Diaz-Frontend-Angular-CV-es.pdf',
    en: 'assets/cv/Jose-Diaz-Frontend-Angular-CV-en.pdf'
  } satisfies Localized<string>
} as const;
