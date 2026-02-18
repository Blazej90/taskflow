import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from './task';

export interface TasksRepository {
  tasks$: Observable<Task[]>;

  load(): void;

  unload(): void;

  save(tasks: Task[]): void;
  create(task: Task): Promise<void>;
  update(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
  reorder(tasks: Task[]): Promise<void>;
}

export const TASKS_REPOSITORY = new InjectionToken<TasksRepository>('TASKS_REPOSITORY');
