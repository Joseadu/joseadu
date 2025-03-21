import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { MainNavComponent } from './main-nav/main-nav.component';
import { routeTransition } from './services/route-transition';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MainNavComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    routeTransition
  ]
})
export class AppComponent {
  title = 'joseadu';

  constructor(protected route: ActivatedRoute) {}
}
