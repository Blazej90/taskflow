import { Injectable } from '@angular/core';
import { Task } from './task';
import { TasksRepository } from './task.repository';

const STORAGE_KEY = 'taskflow.tasks.v1';

@Injectable({ providedIn: 'root' })
export class LocalStorageTasksRepository implements TasksRepository {
  load(): Task[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return null;

      return parsed as Task[];
    } catch {
      return null;
    }
  }

  save(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
}
