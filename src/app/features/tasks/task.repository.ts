// import { InjectionToken } from '@angular/core';
// import { Task } from './task';

// export interface TasksRepository {
//   load(): Task[] | null;
//   save(tasks: Task[]): void;

//   create?(task: Task): Promise<void>;
//   update?(task: Task): Promise<void>;
//   delete?(id: string): Promise<void>;

//   reorder?(tasks: Task[]): Promise<void>;
// }

// export const TASKS_REPOSITORY = new InjectionToken<TasksRepository>('TASKS_REPOSITORY');

import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from './task';

export interface TasksRepository {
  // Zmienione na Observable dla real-time updates
  tasks$: Observable<Task[]>;

  // Inicjuje ładowanie i subskrypcję na zmiany
  load(): void;

  // Zatrzymuje subskrypcję (np. przy wylogowaniu)
  unload(): void;

  save(tasks: Task[]): void;
  create(task: Task): Promise<void>;
  update(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
  reorder(tasks: Task[]): Promise<void>;
}

export const TASKS_REPOSITORY = new InjectionToken<TasksRepository>('TASKS_REPOSITORY');
