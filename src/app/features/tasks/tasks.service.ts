import { Inject, Injectable, signal } from '@angular/core';
import { Task } from './task';
import { TASKS_REPOSITORY, TasksRepository } from './task.repository';

const SEED_TASKS: Task[] = [
  { id: '1', title: 'Zrobić layout TaskFlow', status: 'todo' },
  { id: '2', title: 'Dodać TaskCard', description: 'Input + template', status: 'doing' },
  { id: '3', title: 'Nauczyć się *ngFor', status: 'done' },
];

@Injectable({ providedIn: 'root' })
export class TasksService {
  private _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();

  constructor(@Inject(TASKS_REPOSITORY) private repo: TasksRepository) {
    const initial = this.repo.load() ?? SEED_TASKS;
    this._tasks.set(initial);
    this.repo.save(initial);
  }

  getAll(): Task[] {
    return this._tasks();
  }

  getById(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  create(task: Omit<Task, 'id'>) {
    const newTask: Task = { ...task, id: crypto.randomUUID() };
    const next = [...this._tasks(), newTask];

    this._tasks.set(next);
    this.repo.save(next);
  }

  update(id: string, updated: Omit<Task, 'id'>) {
    const current = this._tasks();
    const index = current.findIndex((t) => t.id === id);
    if (index === -1) return;

    const next = [...current];
    next[index] = { id, ...updated };

    this._tasks.set(next);
    this.repo.save(next);
  }

  delete(id: string) {
    const next = this._tasks().filter((t) => t.id !== id);

    this._tasks.set(next);
    this.repo.save(next);
  }

  toggleStatus(id: string) {
    const current = this._tasks();
    const task = current.find((t) => t.id === id);
    if (!task) return;

    const order = ['todo', 'doing', 'done'] as const;
    const idx = order.indexOf(task.status);
    const nextStatus = order[(idx + 1) % order.length];

    this.update(id, {
      title: task.title,
      description: task.description ?? '',
      status: nextStatus,
    });
  }
}
