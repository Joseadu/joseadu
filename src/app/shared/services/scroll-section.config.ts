/**
 * Constantes de la máquina de estados de scroll por secciones (resistencia + snap).
 * Aisladas en su propio fichero para poder ajustarlas sin tocar la lógica de SectionScrollService.
 */
export const SECTION_SCROLL_CONFIG = {
  /** Distancia acumulada (px) de un gesto para forzar el commit a la siguiente/anterior sección. */
  DRAG_COMMIT_THRESHOLD_PX: 400,
  /** Velocidad (px/s) a partir de la cual un gesto corto pero rápido (flick) también commitea. */
  DRAG_COMMIT_VELOCITY: 900,
  /** Tope visual del desplazamiento de rubber-band. */
  MAX_RUBBERBAND_PX: 400,
  /** Fracción del delta crudo que se traduce en offset visual durante la resistencia. */
  RUBBERBAND_RESISTANCE: 0.35,
  /** Duración del rebote cuando el gesto no supera el umbral. */
  BOUNCE_DURATION_S: 0.45,
  /** Easing del rebote: sin overshoot, resistencia sutil (no elástica). */
  BOUNCE_EASE: 'power3.out',
  /** Duración de la transición confirmada entre secciones (lenis.scrollTo). */
  TRANSITION_DURATION_S: 1.1,
  /** Tiempo tras completar una transición antes de volver a aceptar gestos, para evitar encadenar saltos. */
  TRANSITION_COOLDOWN_MS: 150,
  /** onStopDelay de gsap/Observer: tiempo sin eventos para considerar el gesto terminado. */
  GESTURE_STOP_DELAY_S: 0.15,
  /** Umbral de distancia reducido para el re-entry hacia arriba desde el borde superior de una sección libre. */
  EDGE_REENTRY_PX: 40,
  /** Umbral de velocidad reducido para el mismo re-entry. */
  EDGE_REENTRY_VELOCITY: 500,
  /** Tolerancia (px) para considerar que el scroll está exactamente en el borde superior de una sección libre. */
  TOP_EDGE_EPSILON_PX: 4
} as const;
