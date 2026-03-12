import { Inject, Injectable, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Task } from './task';
import { TASKS_REPOSITORY, TasksRepository } from './task.repository';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();

  readonly creating = signal(false);
  readonly creatingMany = signal(false);
  private _updatingIds = signal<Set<string>>(new Set());
  private _updatingMany = signal(false);
  private _deletingIds = signal<Set<string>>(new Set());
  private _deletingMany = signal(false);

  readonly updatingIds = this._updatingIds.asReadonly();
  readonly deletingIds = this._deletingIds.asReadonly();

  private hasLoaded = signal(false);
  readonly bootLoading = computed(() => !this.hasLoaded());

  readonly loading = computed(() => {
    return (
      this.creating() ||
      this.creatingMany() ||
      this._updatingIds().size > 0 ||
      this._updatingMany() ||
      this._deletingIds().size > 0 ||
      this._deletingMany()
    );
  });

  constructor(
    @Inject(TASKS_REPOSITORY) private repo: TasksRepository,
    private destroyRef: DestroyRef,
  ) {
    this.repo.tasks$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (tasks) => {
        this._tasks.set(tasks);
        this.hasLoaded.set(true);
      },
      error: (err) => {
        console.error('Failed to load tasks:', err);
        this.hasLoaded.set(true);
        this._tasks.set([]);
      },
    });

    this.repo.load();
  }

  getAll(): Task[] {
    return this.tasks();
  }

  getById(id: string): Task | undefined {
    return this.tasks().find((t) => t.id === id);
  }

  isUpdating(id: string): boolean {
    return this._updatingIds().has(id) || this._updatingMany();
  }

  isDeleting(id: string): boolean {
    return this._deletingIds().has(id) || this._deletingMany();
  }

  async create(task: Omit<Task, 'id'>) {
    this.creating.set(true);

    try {
      await this.simulate();

      const newTask: Task = { ...task, id: crypto.randomUUID() };

      await this.repo.create(newTask);
    } finally {
      this.creating.set(false);
    }
  }

  async update(id: string, patch: Partial<Omit<Task, 'id'>>) {
    this.addId(this._updatingIds, id);

    try {
      await this.simulate();

      const task = this.getById(id);
      if (!task) return;

      const updatedTask: Task = { ...task, ...patch };

      await this.repo.update(updatedTask);
    } finally {
      this.removeId(this._updatingIds, id);
    }
  }

  async delete(id: string) {
    this.addId(this._deletingIds, id);

    try {
      await this.simulate();

      await this.repo.delete(id);
    } finally {
      this.removeId(this._deletingIds, id);
    }
  }

  async createMany(tasks: Omit<Task, 'id'>[]) {
    if (tasks.length === 0) return;

    this.creatingMany.set(true);

    try {
      await this.simulate();

      const newTasks: Task[] = tasks.map((task) => ({
        ...task,
        id: crypto.randomUUID(),
      }));

      await Promise.all(newTasks.map((t) => this.repo.create(t)));
    } finally {
      this.creatingMany.set(false);
    }
  }

  async updateMany(updates: { id: string; patch: Partial<Omit<Task, 'id'>> }[]) {
    if (updates.length === 0) return;

    this._updatingMany.set(true);

    try {
      await this.simulate();

      const updatePromises = updates.map(({ id, patch }) => {
        const task = this.getById(id);
        if (!task) return Promise.resolve();

        const updatedTask: Task = { ...task, ...patch };
        return this.repo.update(updatedTask);
      });

      await Promise.all(updatePromises);
    } finally {
      this._updatingMany.set(false);
    }
  }

  async deleteMany(ids: string[]) {
    if (ids.length === 0) return;

    this._deletingMany.set(true);

    try {
      await this.simulate();

      await Promise.all(ids.map((id) => this.repo.delete(id)));
    } finally {
      this._deletingMany.set(false);
    }
  }

  async toggleStatus(id: string) {
    const task = this.getById(id);
    if (!task) return;

    const order = ['todo', 'doing', 'done'] as const;
    const idx = order.indexOf(task.status);
    const nextStatus = order[(idx + 1) % order.length];

    await this.update(id, { status: nextStatus });
  }

  async toggleStatusMany(ids: string[]) {
    if (ids.length === 0) return;

    const order = ['todo', 'doing', 'done'] as const;

    const updates = ids
      .map((id) => {
        const task = this.getById(id);
        if (!task) return null;

        const idx = order.indexOf(task.status);
        const nextStatus = order[(idx + 1) % order.length];

        return {
          id,
          patch: { status: nextStatus },
        };
      })
      .filter((u): u is NonNullable<typeof u> => u !== null);

    await this.updateMany(updates);
  }

  async reorder(orderedIds: string[]) {
    const current = this.tasks();

    const byId = new Map(current.map((t) => [t.id, t] as const));

    const next: Task[] = [];
    for (const id of orderedIds) {
      const task = byId.get(id);
      if (task) next.push(task);
      byId.delete(id);
    }

    for (const t of current) {
      if (byId.has(t.id)) next.push(t);
    }

    const withOrder = next.map((t, i) => ({ ...t, order: i }));

    await this.repo.reorder(withOrder);
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
