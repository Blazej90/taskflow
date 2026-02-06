import { Injectable } from '@angular/core';
import { Task } from './task';

const STORAGE_KEY = 'taskflow.tasks.v1';

function loadFromStorage(): Task[] | null {
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

function saveToStorage(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private tasks: Task[] = loadFromStorage() ?? [
    { id: '1', title: 'Zrobić layout TaskFlow', status: 'todo' },
    { id: '2', title: 'Dodać TaskCard', description: 'Input + template', status: 'doing' },
    { id: '3', title: 'Nauczyć się *ngFor', status: 'done' },
  ];

  constructor() {
    saveToStorage(this.tasks);
  }

  getAll(): Task[] {
    return this.tasks;
  }

  getById(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  create(task: Omit<Task, 'id'>) {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
    };

    this.tasks = [...this.tasks, newTask];
    saveToStorage(this.tasks);
  }

  update(id: string, updated: Omit<Task, 'id'>) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return;

    const next = [...this.tasks];
    next[index] = { id, ...updated };

    this.tasks = next;
    saveToStorage(this.tasks);
  }

  delete(id: string) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    saveToStorage(this.tasks);
  }
}
