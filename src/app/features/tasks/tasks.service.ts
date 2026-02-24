import { Inject, Injectable, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Task } from './task';
import { TASKS_REPOSITORY, TasksRepository } from './task.repository';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();

  readonly creating = signal(false);
  private _updatingIds = signal<Set<string>>(new Set());
  private _deletingIds = signal<Set<string>>(new Set());

  readonly updatingIds = this._updatingIds.asReadonly();
  readonly deletingIds = this._deletingIds.asReadonly();

  private hasLoaded = signal(false);
  readonly bootLoading = computed(() => !this.hasLoaded());

  readonly loading = computed(() => {
    return this.creating() || this._updatingIds().size > 0 || this._deletingIds().size > 0;
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

  async toggleStatus(id: string) {
    const task = this.getById(id);
    if (!task) return;

    const order = ['todo', 'doing', 'done'] as const;
    const idx = order.indexOf(task.status);
    const nextStatus = order[(idx + 1) % order.length];

    await this.update(id, {
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      status: nextStatus,
    });
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
