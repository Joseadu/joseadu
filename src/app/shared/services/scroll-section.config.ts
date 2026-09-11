/**
 * Constantes de la máquina de estados de scroll por secciones (resistencia + snap).
 * Aisladas en su propio fichero para poder ajustarlas sin tocar la lógica de SectionScrollService.
 */
export const SECTION_SCROLL_CONFIG = {
  /** Distancia acumulada (px) de un gesto de rueda/trackpad para forzar el commit a la siguiente/anterior sección. */
  DRAG_COMMIT_THRESHOLD_PX: 400,
  /** Lo mismo para un arrastre con el dedo (móvil): la pantalla es corta y el dedo recorre menos. */
  DRAG_COMMIT_THRESHOLD_TOUCH_PX: 50,
  /** Velocidad (px/s) a partir de la cual un gesto corto pero rápido (flick) también commitea. */
  DRAG_COMMIT_VELOCITY: 900,
  /** Tope visual del desplazamiento de rubber-band con rueda/trackpad. */
  MAX_RUBBERBAND_PX: 400,
  /** Lo mismo con el dedo: en una pantalla pequeña ese recorrido se ve excesivo. */
  MAX_RUBBERBAND_PX_TOUCH: 160,
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
  /** Si la inercia se agota a menos de esta fracción de pantalla de un borde (yendo hacia él), se lleva hasta el borde. */
  EDGE_SNAP_VIEWPORT_RATIO: 0.25,
  /** Tiempo sin scroll para considerar que la inercia ha terminado. */
  EDGE_SNAP_IDLE_MS: 120,
  /** Duración de ese último tramo hasta el borde. */
  EDGE_SNAP_DURATION_S: 0.45,
  /** Tolerancia (px) para considerar que el scroll está exactamente en el borde de una sección (superior o inferior). */
  TOP_EDGE_EPSILON_PX: 4
} as const;
