import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNavComponent } from './main-nav/main-nav.component';
import { GlowBackgroundComponent } from './shared/components/glow-background/glow-background.component';
import { SmoothScrollService } from './shared/services/smooth-scroll.service';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        MainNavComponent,
        GlowBackgroundComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'joseadu';
  private readonly smoothScroll = inject(SmoothScrollService);

  ngOnInit(): void {
    this.smoothScroll.init();
  }
}
