import { Inject, Injectable, computed, signal } from '@angular/core';
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

  readonly creating = signal(false);
  private _updatingIds = signal<Set<string>>(new Set());
  private _deletingIds = signal<Set<string>>(new Set());

  readonly updatingIds = this._updatingIds.asReadonly();
  readonly deletingIds = this._deletingIds.asReadonly();

  readonly loading = computed(() => {
    return this.creating() || this._updatingIds().size > 0 || this._deletingIds().size > 0;
  });

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

  isUpdating(id: string): boolean {
    return this._updatingIds().has(id);
  }

  isDeleting(id: string): boolean {
    return this._deletingIds().has(id);
  }

  async create(task: Omit<Task, 'id'>) {
    this.creating.set(true);

    try {
      await this.simulate();

      const newTask: Task = { ...task, id: crypto.randomUUID() };
      const next = [...this._tasks(), newTask];

      this._tasks.set(next);
      this.repo.save(next);
    } finally {
      this.creating.set(false);
    }
  }

  async update(id: string, updated: Omit<Task, 'id'>) {
    this.addId(this._updatingIds, id);

    try {
      await this.simulate();

      const current = this._tasks();
      const index = current.findIndex((t) => t.id === id);
      if (index === -1) return;

      const next = [...current];
      next[index] = { id, ...updated };

      this._tasks.set(next);
      this.repo.save(next);
    } finally {
      this.removeId(this._updatingIds, id);
    }
  }

  async delete(id: string) {
    this.addId(this._deletingIds, id);

    try {
      await this.simulate();

      const next = this._tasks().filter((t) => t.id !== id);
      this._tasks.set(next);
      this.repo.save(next);
    } finally {
      this.removeId(this._deletingIds, id);
    }
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

  reorder(orderedIds: string[]) {
    const current = this._tasks();

    // mapka dla szybkiego lookup
    const byId = new Map(current.map((t) => [t.id, t] as const));

    // nowa kolejność dla elementów które znamy
    const next: Task[] = [];
    for (const id of orderedIds) {
      const task = byId.get(id);
      if (task) next.push(task);
      byId.delete(id);
    }

    // reszta (nie na liście) zostaje na końcu w dotychczasowej kolejności
    for (const t of current) {
      if (byId.has(t.id)) next.push(t);
    }

    this._tasks.set(next);
    this.repo.save(next);
  }

  private addId(store: typeof this._updatingIds, id: string) {
    store.update((set) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
  }

  private removeId(store: typeof this._updatingIds, id: string) {
    store.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  private simulate(delayMs = 400): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), delayMs);
    });
  }
}
