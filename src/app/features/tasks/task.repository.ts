import { InjectionToken } from '@angular/core';
import { Task } from './task';

export interface TasksRepository {
  load(): Task[] | null;

  save(tasks: Task[]): void;

  create?(task: Task): Promise<void>;
  update?(task: Task): Promise<void>;
  delete?(id: string): Promise<void>;
}

export const TASKS_REPOSITORY = new InjectionToken<TasksRepository>('TASKS_REPOSITORY');
