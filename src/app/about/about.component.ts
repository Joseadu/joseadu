import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortfolioService } from '../shared/services/portfolio.service';

@Component({
    selector: 'app-about',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './about.component.html',
    styleUrl: './about.component.css'
})
export class AboutComponent {
    private readonly portfolioService = inject(PortfolioService);

    readonly experiences = this.portfolioService.experiences;
    readonly education = this.portfolioService.education;
    readonly languages = this.portfolioService.languages;
}
