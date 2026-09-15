/** Posición de una luz en fracción del viewport (0..1), escala y opacidad. */
export interface GlowPose {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

/** Una pose por luz: [verde (.glow-1), roja (.glow-2)]. */
export type GlowComposition = readonly [GlowPose, GlowPose];

const HERO: GlowComposition = [
  { x: 0.4, y: 0.65, scale: 1, opacity: 0.5 },
  { x: 0.6, y: 0.35, scale: 1, opacity: 0.5 }
];

/** Composición de luces por id de sección; las secciones (o rutas) no listadas usan DEFAULT. */
export const GLOW_COMPOSITIONS: Record<string, GlowComposition> = {
  hero: HERO,
  about: [
    { x: 0.12, y: 0.3, scale: 0.8, opacity: 0.4 },
    { x: 0.88, y: 0.75, scale: 1.1, opacity: 0.45 }
  ],
  experience: [
    { x: 0.88, y: 0.2, scale: 0.7, opacity: 0.3 },
    { x: 0.1, y: 0.85, scale: 0.8, opacity: 0.3 }
  ],
  // Vuelve la diagonal al otro lado, para que el salto desde experiencia cruce la pantalla.
  projects: [
    { x: 0.2, y: 0.78, scale: 0.95, opacity: 0.38 },
    { x: 0.82, y: 0.28, scale: 0.9, opacity: 0.4 }
  ],
  // Sección tranquila: luces más pequeñas, apagadas y separadas en vertical.
  education: [
    { x: 0.3, y: 0.15, scale: 0.7, opacity: 0.26 },
    { x: 0.72, y: 0.9, scale: 0.8, opacity: 0.28 }
  ],
  // Cierre: las dos se juntan y suben de intensidad, como un foco detrás del correo.
  contact: [
    { x: 0.42, y: 0.52, scale: 1.2, opacity: 0.5 },
    { x: 0.6, y: 0.48, scale: 1.05, opacity: 0.45 }
  ]
};

export const DEFAULT_GLOW_COMPOSITION = HERO;

export const GLOW_CONFIG = {
  /** Desplazamiento máximo (px) de las luces hacia la sección destino cuando el tirón llega al umbral. */
  PULL_MAX_OFFSET_PX: 90,
  /** Estiramiento vertical máximo en el umbral (1 = sin estirar). */
  PULL_MAX_STRETCH: 1.25,
  /** Suavizado del seguimiento del tirón (s). */
  PULL_FOLLOW_DURATION_S: 0.35,
  /** Curvatura del arco al viajar entre composiciones, como fracción de la distancia recorrida. */
  ARC_FACTOR: 0.45,
  /** Easing del recorrido: arranque decidido y llegada rápida a su sitio. */
  TRAVEL_EASE: 'power3.inOut',
  /** Easing de escala/opacidad: pequeño overshoot al asentarse. */
  SETTLE_EASE: 'back.out(1.6)'
} as const;
