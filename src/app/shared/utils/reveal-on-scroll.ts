import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Quien usa el plugin lo registra: así esta utilidad funciona en cualquier contexto, sin depender
// de que el arranque de la app lo haya hecho antes. registerPlugin es idempotente.
gsap.registerPlugin(ScrollTrigger);

export interface RevealOnScrollOptions {
  y?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  start?: string;
}

const DEFAULTS: Required<RevealOnScrollOptions> = {
  y: 30,
  duration: 0.7,
  stagger: 0.12,
  ease: 'power3.out',
  start: 'top 85%'
};

/**
 * Oculta `items` y los revela con fade + subida al entrar en el viewport, agrupando en stagger
 * los que llegan a la vez. Se apoya en ScrollTrigger.batch, así sirve igual para un puñado de
 * elementos dentro de una sola pantalla que para una lista más alta que el viewport: cada uno
 * dispara su propio ScrollTrigger, devueltos para que el llamante los mate en su ngOnDestroy.
 */
export function revealOnScroll(items: HTMLElement[], options?: RevealOnScrollOptions): ScrollTrigger[] {
  if (items.length === 0) return [];

  const config = { ...DEFAULTS, ...options };
  gsap.set(items, { opacity: 0, y: config.y });

  return ScrollTrigger.batch(items, {
    start: config.start,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: config.duration,
        stagger: config.stagger,
        ease: config.ease,
        overwrite: 'auto'
      })
  });
}
