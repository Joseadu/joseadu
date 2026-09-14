import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'about',
        component: AboutComponent
    },
    {
        // Cualquier URL desconocida vuelve a la home. Antes apuntaba a 'home', que no existe como
        // ruta, así que la navegación fallaba en vez de redirigir.
        path: '**',
        pathMatch: 'full',
        redirectTo: ''
    }
];
