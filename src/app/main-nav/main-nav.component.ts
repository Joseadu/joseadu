import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SectionScrollService } from '../shared/services/section-scroll.service';

@Component({
    selector: 'app-main-nav',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './main-nav.component.html',
    styleUrl: './main-nav.component.css'
})
export class MainNavComponent {
    private readonly sectionScroll = inject(SectionScrollService);
    private readonly router = inject(Router);

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
}
