import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SmoothScrollService } from '../shared/services/smooth-scroll.service';

@Component({
    selector: 'app-main-nav',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './main-nav.component.html',
    styleUrl: './main-nav.component.css'
})
export class MainNavComponent {
    private readonly smoothScroll = inject(SmoothScrollService);
    private readonly router = inject(Router);

    navigateTo(target: string): void {
        if (this.router.url === '/' || this.router.url === '') {
            this.smoothScroll.scrollTo(target);
        } else {
            this.router.navigate(['/']).then(() => {
                setTimeout(() => this.smoothScroll.scrollTo(target), 120);
            });
        }
    }
}
