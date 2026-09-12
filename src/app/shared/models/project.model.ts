export interface Project {
  id: string;
  title: string;
  /** Tipo de proyecto en una línea: se muestra bajo el título. */
  category?: string;
  year?: string;
  description: string;
  tags: string[];
  link?: string;
  github?: string;
  image?: string;
  featured?: boolean;
}
