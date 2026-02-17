// import { Injectable } from '@angular/core';
// import { Task } from './task';
// import { TasksRepository } from './task.repository';

// const STORAGE_KEY = 'taskflow.tasks.v1';

// @Injectable({ providedIn: 'root' })
// export class LocalStorageTasksRepository implements TasksRepository {
//   load(): Task[] | null {
//     try {
//       const raw = localStorage.getItem(STORAGE_KEY);
//       if (!raw) return null;

//       const parsed = JSON.parse(raw) as unknown;
//       if (!Array.isArray(parsed)) return null;

//       return parsed as Task[];
//     } catch {
//       return null;
//     }
//   }

//   save(tasks: Task[]): void {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
//   }
// }

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from './task';
import { TasksRepository } from './task.repository';

@Injectable({ providedIn: 'root' })
export class LocalStorageTasksRepository implements TasksRepository {
  private readonly STORAGE_KEY = 'taskflow_tasks';
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  load(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const tasks = data ? JSON.parse(data) : [];
    this.tasksSubject.next(tasks);
  }

  unload(): void {
    this.tasksSubject.next([]);
  }

  save(tasks: Task[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    this.tasksSubject.next(tasks);
  }

  async create(task: Task): Promise<void> {
    const current = this.tasksSubject.value;
    const next = [...current, task];
    this.save(next);
  }

  async update(task: Task): Promise<void> {
    const current = this.tasksSubject.value;
    const next = current.map((t) => (t.id === task.id ? task : t));
    this.save(next);
  }

  async delete(id: string): Promise<void> {
    const current = this.tasksSubject.value;
    const next = current.filter((t) => t.id !== id);
    this.save(next);
  }

  async reorder(tasks: Task[]): Promise<void> {
    this.save(tasks);
  }
}
