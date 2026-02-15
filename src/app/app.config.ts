import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

import { TASKS_REPOSITORY } from './features/tasks/task.repository';
import { FirestoreTasksRepository } from './features/tasks/tasks.repository.firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),

    { provide: TASKS_REPOSITORY, useClass: FirestoreTasksRepository },
  ],
};
