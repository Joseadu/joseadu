import { Localized } from '../i18n/language.config';
import { Education, Experience, Language } from '../models/experience.model';
import { Project } from '../models/project.model';

/*
 * Contenido del portfolio en origen. Solo los campos de texto llevan un valor por idioma;
 * lo que no se traduce (empresas, fechas, stack) se define una vez. PortfolioService lo
 * resuelve al idioma activo.
 */

export type ExperienceSource = Omit<Experience, 'responsibilities' | 'location'> & {
  responsibilities: Localized<string[]>;
  location?: Localized<string>;
};
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
    location: { es: 'Remoto', en: 'Remote' },
    role: 'Frontend Software Developer',
    responsibilities: {
      es: [
        'Desarrollo de microfrontends dentro de una aplicación contenedora, cada uno un proyecto independiente.',
        'Gestión global del estado mediante NgRx.',
        'Integración con APIs REST.',
        'Implementación de AG Grid para tablas complejas.',
        'Desarrollo de testing unitario con Jasmine y revisión de código.'
      ],
      en: [
        'Built micro-frontends inside a container application, each one a separate project.',
        'Managed global application state with NgRx.',
        'Integrated REST APIs.',
        'Implemented AG Grid for complex data tables.',
        'Wrote unit tests with Jasmine and took part in code reviews.'
      ]
    },
    stack: ['Angular 21', 'TypeScript', 'RxJS', 'NgRx', 'Signals', 'AG Grid', 'Jasmine', 'PrimeNG', 'Microfront']
  },
  {
    company: 'Knowmad Mood',
    client: 'El Corte Inglés',
    period: '03/2025 - 12/2025',
    location: { es: 'Remoto', en: 'Remote' },
    role: 'Frontend Software Developer',
    responsibilities: {
      es: [
        'Migración del backoffice a una versión moderna de Angular.',
        'Creación de componentes reutilizables y formularios dinámicos.',
        'Integración con APIs REST.',
        'Participación activa en revisiones de código y gestión de Pull Requests.',
        'Relación directa con el equipo de diseño y producto, bajo metodología Scrum.'
      ],
      en: [
        'Migrated the back office to a modern version of Angular.',
        'Built reusable components and dynamic forms.',
        'Integrated REST APIs.',
        'Took an active part in code reviews and pull request management.',
        'Worked directly with the design and product teams, in Scrum.'
      ]
    },
    stack: ['Angular 19-20', 'RxJS', 'NgRx', 'Cypress', 'Bitbucket', 'Custom CSS Framework']
  },
  {
    company: 'Mydance',
    period: '03/2024 - 03/2025',
    location: { es: 'Remoto', en: 'Remote' },
    role: 'Frontend Angular Developer',
    responsibilities: {
      es: [
        'Desarrollo del front de la aplicación con Angular 18.',
        'Implementación de un componente servido como microfrontend con Native Federation.',
        'Implementación de autenticación OAuth2 y gestión de estado con NgRx.',
        'Desarrollo del design system con componentes reutilizables.',
        'Mentoría de un desarrollador junior.'
      ],
      en: [
        'Built the front end of the application with Angular 18.',
        'Implemented a component served as a micro-frontend with Native Federation.',
        'Implemented OAuth2 authentication and state management with NgRx.',
        'Built the design system with reusable components.',
        'Mentored a junior developer.'
      ]
    },
    stack: ['Angular 17-18', 'NgRx', 'OAuth2', 'Microfront', 'Jasmine', 'Tailwind CSS']
  },
  {
    company: 'Izertis',
    client: 'BMW',
    period: '04/2023 - 12/2023',
    location: { es: 'Remoto', en: 'Remote' },
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
    stack: ['Angular', '.NET', '.NET MVC', 'Entity Framework', 'SQL Server']
  },
  {
    company: 'Concilio Communications',
    period: '01/2021 - 08/2022',
    location: { es: 'Presencial, Londres', en: 'On-site, London' },
    role: 'Web Developer',
    responsibilities: {
      es: [
        'Desarrollo y mantenimiento de la cartera de más de 80 webs WordPress de la agencia, para constructoras e inversores.',
        'Interlocución directa con los clientes en inglés: toma de requisitos, propuesta de soluciones y coordinación de entregas.',
        'Gestión del hosting y resolución de incidencias de los sitios en producción.'
      ],
      en: [
        'Developed and maintained the agency portfolio of over 80 WordPress sites, for construction companies and investors.',
        'Worked directly with clients: gathering requirements, proposing solutions and coordinating deliveries.',
        'Managed hosting and resolved incidents on live sites.'
      ]
    },
    stack: ['Wordpress', 'Elementor Pro', 'Crocoblock stack', 'Hosting Management']
  }
];

export const EDUCATION: EducationSource[] = [
  {
    institution: 'Platzi',
    period: '01/2021 - 04/2023',
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
    period: '09/2015 - 06/2017',
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
      es: 'La web personal de una diseñadora de marcas, donde el trabajo tenía que verse antes que leerse. Rejilla de proyectos, ficha propia para cada caso y la web entera en español e inglés.',
      en: 'A portfolio for a brand designer, where the work had to be seen before it was read. A project grid, a page of its own for each case, and the whole site in Spanish and English.'
    },
    tags: [],
    link: 'https://irudesigner.com/proyectos',
    github: 'https://github.com/Joseadu/irudesigner',
    image: 'assets/images/irudesigner.png'
  },
  {
    id: 'fitness-booking',
    title: 'Fitness Booking',
    category: {
      es: 'App de reserva de clases',
      en: 'Class booking app'
    },
    description: {
      es: 'Reserva de clases para un box de entrenamiento: horarios, plazas que quedan, gestión de tu box, las reservas de cada atleta, etc. Una plataforma para conectar negocio y cliente.',
      en: 'A personal project. Class booking for a training box: schedules, spots left and each member bookings, instead of a list kept by hand.'
    },
    tags: [],
    image: 'assets/images/fitness-booking.png',
    github: 'https://github.com/Joseadu/fitness-booking',
  },
  {
    id: 'libralix',
    title: 'Libralix',
    category: {
      es: 'Red social para lectores',
      en: 'Social network for readers'
    },
    description: {
      es: 'Una red social para lectores: qué estás leyendo, qué te ha parecido y qué leen los que sigues. La idea es que descubrir un libro venga de alguien, no de un algoritmo.',
      en: 'A social network for readers: what you are reading, what you made of it and what the people you follow are reading. The idea being that a book comes recommended by someone, not by an algorithm.'
    },
    tags: [],
    github: 'https://github.com/Joseadu/libralix',
    featured: true,
    image: 'assets/images/libralix.png'
  }
];
