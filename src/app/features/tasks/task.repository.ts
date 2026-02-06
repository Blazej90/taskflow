import { InjectionToken } from '@angular/core';
import { Task } from './task';

export interface TasksRepository {
  load(): Task[] | null;
  save(tasks: Task[]): void;
}

export const TASKS_REPOSITORY = new InjectionToken<TasksRepository>('TASKS_REPOSITORY');
