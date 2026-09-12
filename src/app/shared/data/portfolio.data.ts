import { Localized } from '../i18n/language.config';
import { Education, Experience, Language } from '../models/experience.model';
import { Project } from '../models/project.model';

/*
 * Contenido del portfolio en origen. Solo los campos de texto llevan un valor por idioma;
 * lo que no se traduce (empresas, fechas, stack) se define una vez. PortfolioService lo
 * resuelve al idioma activo.
 */

export type ExperienceSource = Omit<Experience, 'responsibilities'> & { responsibilities: Localized<string[]> };
export type EducationSource = Omit<Education, 'title' | 'details'> & {
  title: Localized<string>;
  details?: Localized<string[]>;
};
export type LanguageSource = { language: Localized<string>; level: Localized<string> };
export type ProjectSource = Omit<Project, 'description' | 'category'> & {
  description: Localized<string>;
  category?: Localized<string>;
};

export const EXPERIENCES: ExperienceSource[] = [
  {
    company: 'Knowmad Mood',
    client: 'Exolum',
    period: '12/2025 - 05/2026',
    role: 'Frontend Software Developer',
    responsibilities: {
      es: [
        'Desarrollo de aplicaciones Angular en arquitectura basada en microservicios.',
        'Migración de código legacy a estándares modernos (Signals, Standalone Components).',
        'Gestión global del estado mediante NgRx.',
        'Implementación de AG Grid para aplicaciones empresariales.',
        'Desarrollo de testing unitario con Jasmine.'
      ],
      en: [
        'Developed Angular applications within a microservices-based architecture.',
        'Migrated legacy code to modern standards (Signals, Standalone Components).',
        'Managed global application state with NgRx.',
        'Implemented AG Grid for enterprise applications.',
        'Wrote unit tests with Jasmine.'
      ]
    },
    stack: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Signals', 'AG Grid', 'Jasmine']
  },
  {
    company: 'Knowmad Mood',
    client: 'El Corte Inglés',
    period: '03/2025 - 12/2025',
    role: 'Frontend Software Developer',
    responsibilities: {
      es: [
        'Desarrollo y mantenimiento de aplicaciones empresariales con Angular.',
        'Creación de componentes reutilizables y formularios dinámicos.',
        'Integración con APIs REST.',
        'Revisión de código y gestión de Pull Requests.',
        'Trabajo bajo metodología Scrum.'
      ],
      en: [
        'Developed and maintained enterprise applications with Angular.',
        'Built reusable components and dynamic forms.',
        'Integrated REST APIs.',
        'Reviewed code and managed Pull Requests.',
        'Worked in Scrum teams.'
      ]
    },
    stack: ['Angular 16-19', 'RxJS', 'NgRx', 'Cypress', 'Git', 'Bitbucket']
  },
  {
    company: 'Mydance',
    period: '03/2024 - 03/2025',
    role: 'Frontend Angular Developer',
    responsibilities: {
      es: [
        'Desarrollo de arquitectura microfrontend mediante Native Federation.',
        'Implementación de autenticación OAuth2.',
        'Gestión de estado con NgRx.',
        'Desarrollo de componentes reutilizables y formularios complejos.',
        'Mentoría de un desarrollador junior.'
      ],
      en: [
        'Built a micro-frontend architecture with Native Federation.',
        'Implemented OAuth2 authentication.',
        'Managed state with NgRx.',
        'Developed reusable components and complex forms.',
        'Mentored a junior developer.'
      ]
    },
    stack: ['Angular 17-18', 'NgRx', 'OAuth2', 'Native Federation', 'Jasmine']
  },
  {
    company: 'Izertis',
    client: 'BMW',
    period: '04/2023 - 12/2023',
    role: 'Junior Fullstack Consultant',
    responsibilities: {
      es: [
        'Desarrollo de módulos web con Angular y .NET MVC.',
        'Implementación de APIs REST.',
        'Desarrollo de consultas SQL Server.',
        'Mantenimiento de aplicaciones corporativas.'
      ],
      en: [
        'Developed web modules with Angular and .NET MVC.',
        'Implemented REST APIs.',
        'Wrote SQL Server queries.',
        'Maintained corporate applications.'
      ]
    },
    stack: ['Angular', '.NET MVC', 'SQL Server']
  },
  {
    company: 'Concilio Communications',
    period: '01/2021 - 08/2022',
    role: 'Web Developer',
    responsibilities: {
      es: [
        'Desarrollo y mantenimiento de sitios WordPress.',
        'Gestión de hosting e incidencias.',
        'Comunicación directa con clientes.'
      ],
      en: [
        'Developed and maintained WordPress sites.',
        'Managed hosting and support issues.',
        'Worked directly with clients.'
      ]
    },
    stack: ['Wordpress', 'Elementor Pro', 'Crocoblock stack']
  }
];

export const EDUCATION: EducationSource[] = [
  {
    institution: 'Platzi',
    period: '01/2021 - 10/2023',
    title: {
      es: 'Formación continua Frontend & Fullstack',
      en: 'Continuous Frontend & Fullstack training'
    },
    details: {
      es: ['Escuela fullstack con .NET y Javascript', 'Escuela frontend con Angular'],
      en: ['Fullstack school with .NET and JavaScript', 'Frontend school with Angular']
    }
  },
  {
    institution: 'IES La Rosaleda',
    period: '00/2015 - 06/2017',
    title: {
      es: 'Técnico en Instalaciones de Telecomunicaciones',
      en: 'Vocational Diploma in Telecommunications Installations'
    }
  }
];

export const LANGUAGES: LanguageSource[] = [
  {
    language: { es: 'Inglés', en: 'English' },
    level: { es: 'Profesional, conversacional', en: 'Professional, working proficiency' }
  },
  {
    language: { es: 'Español', en: 'Spanish' },
    level: { es: 'Nativo', en: 'Native' }
  }
];

export const PROJECTS: ProjectSource[] = [
  {
    id: 'irudesigner',
    title: 'Irudesigner',
    category: {
      es: 'Web para diseñadora de marcas',
      en: 'Website for a brand designer'
    },
    description: {
      es: 'Este es el sitio web de Irudesigner, diseñadora de marcas',
      en: 'This is a website for Irudesigner, a brand designer.'
    },
    tags: [],
    link: 'https://irudesigner.com/proyectos',
    github: '/projects/irudesigner',
    image: 'assets/images/irudesigner.png'
  },
  {
    id: 'joseadu-portfolio',
    title: 'joseadu.com',
    category: {
      es: 'Portfolio personal',
      en: 'Personal portfolio'
    },
    year: '2026',
    description: {
      es: 'Portfolio personal interactivo desarrollado con Angular 19, OnPush, Signals y diseño minimalista enfocado en rendimiento y animaciones fluidas.',
      en: 'Interactive personal portfolio built with Angular 19, OnPush and Signals, with a minimalist design focused on performance and smooth animations.'
    },
    tags: ['Angular 19', 'TypeScript', 'CSS Tokens', 'Signals', 'OnPush'],
    github: 'https://github.com/joseadu',
    featured: true
  }
];
