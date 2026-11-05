import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'users/new',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/users/user-create/user-create').then(m => m.UserCreateComponent)
  },
  {
    path: 'users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/users/user-list/user-list').then(m => m.UserListComponent)
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/products/products.routes').then(m => m.PRODUCT_ROUTES)
  },
  { path: '**', redirectTo: 'products' }
];