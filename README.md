# joseadu

Personal portfolio of Jose Díaz, frontend developer. A single page in Spanish and English, built
around a custom section-paging scroll: instead of scrolling freely, the page moves section by
section, and pushing against a section's edge stretches it like a rubber band until the gesture is
long enough to commit to the next one.

> **Live:** www.joseadu.com

## Stack

| | |
| --- | --- |
| Framework | Angular 19.2 (standalone components, signals, `OnPush` everywhere) |
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) 1.3 |
| Animation | [GSAP](https://gsap.com) 3.15 — `ScrollTrigger` and `Observer` |
| i18n | [ngx-translate](https://github.com/ngx-translate/core) 18 |
| Language | TypeScript 5.5 |

No UI library and no CSS framework: the design system is a handful of custom properties in
`src/styles/variables/` plus shared utility classes in `src/styles/utilities/`.

## Getting started

```bash
npm install
npm start        # dev server at http://localhost:4200
npm run build    # production build into dist/joseadu/browser
npm test         # unit tests (Karma + Jasmine)
```

## How the scroll works

This is the part worth reading. Four pieces, each with one job:

| File | Responsibility |
| --- | --- |
| `shared/services/smooth-scroll.service.ts` | Owns the Lenis instance, driven from `gsap.ticker` so scroll and animation share one clock. Exposes `stop()`, `start()`, `scrollTo()` and `jumpTo()`. |
| `shared/services/scroll-gesture.service.ts` | Wraps `gsap/Observer` and normalises wheel, touch and pointer input into a single signed delta per tick, plus an end-of-gesture event. |
| `shared/services/section-scroll.service.ts` | The state machine. Knows the registered sections, decides when to lock Lenis, applies the rubber band, and commits the transition. |
| `shared/services/scroll-section.config.ts` | Every tunable number in one place: commit thresholds, rubber-band travel, bounce and transition timings. |

A section opts in by adding the `appScrollSection` directive, which registers it with the service:

```html
<div appScrollSection="projects" [sectionLabel]="'sections.projects' | translate"> … </div>
```

Behaviour worth knowing:

- **Sections that fit the viewport** are fully paged: Lenis is stopped and the only movement is the
  rubber band, which springs back unless the gesture passes the commit threshold.
- **Sections taller than the viewport** scroll freely inside, and their edges act as walls. Leaving
  one takes a fresh gesture that starts at the edge, so momentum never skips past a boundary.
- **Touch and wheel are measured separately.** A finger travels far fewer pixels than a wheel, so
  each has its own commit threshold and rubber-band travel.
- **Inertia that dies just short of an edge** is carried the rest of the way, instead of leaving the
  page parked a few pixels off.
- **`prefers-reduced-motion`** disables the whole thing and restores plain native scrolling.

The service publishes two streams that the decorative pieces subscribe to, which is why the lights,
the mouse indicator and the pull hint all move together: `onPull` (how far the current gesture has
stretched, from -1 to 1) and `onTransition` (a section change has started).

| Consumer | What it does with them |
| --- | --- |
| `shared/components/scroll-indicator` | The mouse at the bottom of a section stretches with the pull and turns accent-coloured once releasing would commit. |
| `shared/components/pull-hint` | Appears under the header while pulling upwards, naming the section you are about to return to. |
| `shared/components/glow-background` | The background lights travel between compositions on every section change. |

## Content and translations

Text lives outside the components, split by kind:

| What | Where |
| --- | --- |
| UI strings | `public/i18n/es.json`, `public/i18n/en.json` |
| CV content (jobs, education, languages) | `src/app/shared/data/portfolio.data.ts` |
| Projects | `src/app/shared/data/portfolio.data.ts` |
| Email, social links, CV files | `src/app/shared/data/contact.data.ts` |
| Images and CV PDFs | `src/assets/images/`, `src/assets/cv/` |

In the data files, only the translatable fields carry one value per language; everything factual
(companies, dates, stack) is written once. `PortfolioService` resolves them to the active language,
so switching language re-renders the content without a reload.

The initial language is the stored preference, then the browser language, then Spanish. It is
persisted in `localStorage` and kept in sync with `<html lang>`. Translations load before the first
render, so no untranslated keys ever flash on screen.

## Project structure

```
src/app/
  home/          the page: hero and about, plus the four paged section wrappers
  about/         experience timeline
  projects/      project cards
  education/     education and languages
  contact/       email, links and CV
  main-nav/      header
  shared/
    components/  scroll indicator, pull hint, glow background
    data/        portfolio and contact content
    directives/  appScrollSection
    i18n/        language config and service
    services/    scroll engine and portfolio content
    utils/       reveal-on-scroll helper
```

## Notes

- No SSR: this is a static SPA. The build output in `dist/joseadu/browser` is everything that needs
  deploying, and anything placed in `public/` is copied to the root as-is.
- Keyboard users get the same paging: arrows and page keys move between sections, and inside a tall
  section they scroll normally until they reach an edge.
