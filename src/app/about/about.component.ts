import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-about',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './about.component.html',
    styleUrl: './about.component.css'
})
export class AboutComponent {

}
