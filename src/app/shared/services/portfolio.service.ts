import { Injectable, signal } from '@angular/core';
import { Education, Experience, Language } from '../models/experience.model';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  readonly experiences = signal<Experience[]>([
    {
      company: 'Knowmad Mood',
      client: 'Exolum',
      period: '12/2025 - 05/2026',
      role: 'Frontend Software Developer',
      responsibilities: [
        'Desarrollo de aplicaciones Angular en arquitectura basada en microservicios.',
        'Migración de código legacy a estándares modernos (Signals, Standalone Components).',
        'Gestión global del estado mediante NgRx.',
        'Implementación de AG Grid para aplicaciones empresariales.',
        'Desarrollo de testing unitario con Jasmine.'
      ],
      stack: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Signals', 'AG Grid', 'Jasmine']
    },
    {
      company: 'Knowmad Mood',
      client: 'El Corte Inglés',
      period: '03/2025 - 12/2025',
      role: 'Frontend Software Developer',
      responsibilities: [
        'Desarrollo y mantenimiento de aplicaciones empresariales con Angular.',
        'Creación de componentes reutilizables y formularios dinámicos.',
        'Integración con APIs REST.',
        'Revisión de código y gestión de Pull Requests.',
        'Trabajo bajo metodología Scrum.'
      ],
      stack: ['Angular 16-19', 'RxJS', 'NgRx', 'Cypress', 'Git', 'Bitbucket']
    },
    {
      company: 'Mydance',
      period: '03/2024 - 03/2025',
      role: 'Frontend Angular Developer',
      responsibilities: [
        'Desarrollo de arquitectura microfrontend mediante Native Federation.',
        'Implementación de autenticación OAuth2.',
        'Gestión de estado con NgRx.',
        'Desarrollo de componentes reutilizables y formularios complejos.',
        'Mentoría de un desarrollador junior.'
      ],
      stack: ['Angular 17-18', 'NgRx', 'OAuth2', 'Native Federation', 'Jasmine']
    },
    {
      company: 'Izertis - BMW',
      period: '04/2023 - 12/2023',
      role: 'Junior Fullstack Consultant',
      responsibilities: [
        'Desarrollo de módulos web con Angular y .NET MVC.',
        'Implementación de APIs REST.',
        'Desarrollo de consultas SQL Server.',
        'Mantenimiento de aplicaciones corporativas.'
      ],
      stack: ['Angular', '.NET MVC', 'SQL Server']
    },
    {
      company: 'Concilio Communications',
      period: '01/2021 - 08/2022',
      role: 'Web Developer',
      responsibilities: [
        'Desarrollo y mantenimiento de sitios WordPress.',
        'Gestión de hosting e incidencias.',
        'Comunicación directa con clientes.'
      ],
      stack: ['Wordpress', 'Elementor Pro', 'Crocoblock stack']
    }
  ]);

  readonly education = signal<Education[]>([
    {
      institution: 'Platzi',
      period: '01/2021 - Presente',
      title: 'Formación continua Frontend & Fullstack',
      details: [
        'Escuela fullstack con .NET y Javascript',
        'Escuela frontend con Angular'
      ]
    },
    {
      institution: 'IES La Rosaleda',
      period: '00/2015 - 06/2017',
      title: 'Técnico en Instalaciones de Telecomunicaciones'
    }
  ]);

  readonly languages = signal<Language[]>([
    { language: 'Inglés', level: 'Profesional, conversacional' },
    { language: 'Español', level: 'Nativo' }
  ]);

  readonly projects = signal<Project[]>([
    {
      id: 'joseadu-portfolio',
      title: 'joseadu.com',
      description: 'Portfolio personal interactivo desarrollado con Angular 19, OnPush, Signals y diseño minimalista enfocado en rendimiento y animaciones fluidas.',
      tags: ['Angular 19', 'TypeScript', 'CSS Tokens', 'Signals', 'OnPush'],
      github: 'https://github.com/joseadu',
      featured: true
    }
  ]);
}
