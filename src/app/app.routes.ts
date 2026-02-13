import { Routes } from '@angular/router';
import { AuthPage } from './features/auth/pages/auth-page/auth-page';

export const routes: Routes = [
  { path: 'auth', component: AuthPage },

  {
    path: 'tasks',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/tasks/pages/task-list/task-list').then((m) => m.TaskList),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/tasks/pages/task-form/task-form').then((m) => m.TaskForm),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./features/tasks/pages/task-form/task-form').then((m) => m.TaskForm),
      },
    ],
  },

  { path: '', redirectTo: 'auth', pathMatch: 'full' },

  { path: '**', redirectTo: 'auth' },
];
