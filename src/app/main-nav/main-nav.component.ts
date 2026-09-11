import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppLanguage, SUPPORTED_LANGUAGES } from '../shared/i18n/language.config';
import { LanguageService } from '../shared/i18n/language.service';
import { SectionScrollService } from '../shared/services/section-scroll.service';

@Component({
    selector: 'app-main-nav',
    imports: [TranslatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './main-nav.component.html',
    styleUrl: './main-nav.component.css'
})
export class MainNavComponent {
    private readonly sectionScroll = inject(SectionScrollService);
    private readonly router = inject(Router);
    private readonly languageService = inject(LanguageService);

    readonly languages = SUPPORTED_LANGUAGES;
    readonly currentLanguage = this.languageService.current;

    navigateTo(target: string): void {
        const id = target.replace('#', '');

        if (this.router.url === '/' || this.router.url === '') {
            this.sectionScroll.goToSection(id);
            return;
        }

        this.router.navigate(['/']).then(() => {
            this.sectionScroll.whenSectionReady(id).then(() => this.sectionScroll.goToSection(id));
        });
    }

    setLanguage(lang: AppLanguage): void {
        this.languageService.setLanguage(lang);
    }
}
