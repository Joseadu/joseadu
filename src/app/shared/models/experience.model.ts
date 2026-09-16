export interface Experience {
  company: string;
  client?: string;
  period: string;
  /** Dónde se hizo el trabajo: remoto, presencial y plaza. */
  location?: string;
  role: string;
  responsibilities: string[];
  stack: string[];
}

export interface Education {
  institution: string;
  period: string;
  title: string;
  details?: string[];
}

export interface Language {
  language: string;
  level: string;
}
