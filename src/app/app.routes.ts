import { Routes } from '@angular/router';

export const routes: Routes = [
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
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
];
