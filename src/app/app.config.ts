import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { TASKS_REPOSITORY } from './features/tasks/task.repository';
import { LocalStorageTasksRepository } from './features/tasks/local-storage-tasks.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    { provide: TASKS_REPOSITORY, useClass: LocalStorageTasksRepository },
  ],
};
