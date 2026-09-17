import { TestBed } from '@angular/core/testing';

import { LanguageService } from '../i18n/language.service';
import { provideTranslateTesting } from '../i18n/translate.testing';
import { PortfolioService } from './portfolio.service';

/*
 * El contenido del portfolio se guarda con un valor por idioma y se resuelve al idioma activo.
 * Estos tests comprueban ese mecanismo, no las frases concretas: así siguen valiendo cuando se
 * reescriba el contenido.
 */
describe('PortfolioService', () => {
  let portfolio: PortfolioService;
  let language: LanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateTesting()]
    });

    portfolio = TestBed.inject(PortfolioService);
    language = TestBed.inject(LanguageService);
  });

  it('devuelve el contenido traducible en el idioma activo', () => {
    const spanish = portfolio.experiences();

    language.setLanguage('en');
    const english = portfolio.experiences();

    expect(english.length).toBe(spanish.length);
    expect(english.length).toBeGreaterThan(0);
    expect(english[0].responsibilities).not.toEqual(spanish[0].responsibilities);
  });

  it('deja intactos los datos que no dependen del idioma', () => {
    const spanish = portfolio.experiences();

    language.setLanguage('en');
    const english = portfolio.experiences();

    english.forEach((experience, index) => {
      expect(experience.company).toBe(spanish[index].company);
      expect(experience.period).toBe(spanish[index].period);
      expect(experience.stack).toEqual(spanish[index].stack);
    });
  });

  it('traduce también proyectos, formación e idiomas', () => {
    const before = {
      project: portfolio.projects()[0].description,
      education: portfolio.education()[0].title,
      language: portfolio.languages()[0].level
    };

    language.setLanguage('en');

    expect(portfolio.projects()[0].description).not.toBe(before.project);
    expect(portfolio.education()[0].title).not.toBe(before.education);
    expect(portfolio.languages()[0].level).not.toBe(before.language);
  });
});
