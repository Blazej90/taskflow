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

  readonly loading = signal(false);

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

  async create(task: Omit<Task, 'id'>) {
    await this.simulate();

    const newTask: Task = { ...task, id: crypto.randomUUID() };
    const next = [...this._tasks(), newTask];

    this._tasks.set(next);
    this.repo.save(next);
  }

  async update(id: string, updated: Omit<Task, 'id'>) {
    await this.simulate();

    const current = this._tasks();
    const index = current.findIndex((t) => t.id === id);
    if (index === -1) return;

    const next = [...current];
    next[index] = { id, ...updated };

    this._tasks.set(next);
    this.repo.save(next);
  }

  async delete(id: string) {
    await this.simulate();

    const next = this._tasks().filter((t) => t.id !== id);
    this._tasks.set(next);
    this.repo.save(next);
  }

  async toggleStatus(id: string) {
    const current = this._tasks();
    const task = current.find((t) => t.id === id);
    if (!task) return;

    const order = ['todo', 'doing', 'done'] as const;
    const idx = order.indexOf(task.status);
    const nextStatus = order[(idx + 1) % order.length];

    await this.update(id, {
      title: task.title,
      description: task.description ?? '',
      status: nextStatus,
    });
  }

  private simulate(delayMs = 400): Promise<void> {
    this.loading.set(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        this.loading.set(false);
        resolve();
      }, delayMs);
    });
  }
}
