import { computed, inject, Injectable } from '@angular/core';
import { EDUCATION, EXPERIENCES, LANGUAGES, PROJECTS } from '../data/portfolio.data';
import { LanguageService } from '../i18n/language.service';
import { Education, Experience, Language } from '../models/experience.model';
import { Project } from '../models/project.model';

/** Contenido del portfolio ya resuelto al idioma activo: cambia solo al cambiar de idioma. */
@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private readonly lang = inject(LanguageService).current;

  readonly experiences = computed<Experience[]>(() => {
    const lang = this.lang();
    return EXPERIENCES.map(({ responsibilities, ...rest }) => ({
      ...rest,
      responsibilities: responsibilities[lang]
    }));
  });

  readonly education = computed<Education[]>(() => {
    const lang = this.lang();
    return EDUCATION.map(({ title, details, ...rest }) => ({
      ...rest,
      title: title[lang],
      details: details?.[lang]
    }));
  });

  readonly languages = computed<Language[]>(() => {
    const lang = this.lang();
    return LANGUAGES.map(({ language, level }) => ({ language: language[lang], level: level[lang] }));
  });

  readonly projects = computed<Project[]>(() => {
    const lang = this.lang();
    return PROJECTS.map(({ description, category, ...rest }) => ({
      ...rest,
      description: description[lang],
      category: category?.[lang]
    }));
  });
}
