import { Inject, Injectable, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Task } from './task';
import { TASKS_REPOSITORY, TasksRepository } from './task.repository';

/**
 * Service for managing tasks state and operations.
 *
 * Acts as a facade between UI components and the repository layer.
 * Uses Angular Signals for reactive state management and provides
 * optimistic updates with loading indicators.
 *
 * @example
 * // Basic usage in component
 * export class TaskList {
 *   private tasksService = inject(TasksService);
 *
 *   // Read tasks reactively
 *   tasks = this.tasksService.tasks;
 *   loading = this.tasksService.loading;
 *
 *   async handleCreate() {
 *     await this.tasksService.create({
 *       title: 'New Task',
 *       status: 'todo',
 *       priority: 'medium'
 *     });
 *   }
 * }
 */
@Injectable({ providedIn: 'root' })
export class TasksService {
  private _tasks = signal<Task[]>([]);

  /** Read-only signal of all tasks, sorted by order */
  readonly tasks = this._tasks.asReadonly();

  /** Loading state for single create operation */
  readonly creating = signal(false);

  /** Loading state for bulk create operation */
  readonly creatingMany = signal(false);

  private _updatingIds = signal<Set<string>>(new Set());
  private _updatingMany = signal(false);
  private _deletingIds = signal<Set<string>>(new Set());
  private _deletingMany = signal(false);

  /**
   * Set of task IDs currently being updated.
   * Use isUpdating(id) for checking individual tasks.
   */
  readonly updatingIds = this._updatingIds.asReadonly();

  /**
   * Set of task IDs currently being deleted.
   * Use isDeleting(id) for checking individual tasks.
   */
  readonly deletingIds = this._deletingIds.asReadonly();

  private hasLoaded = signal(false);

  /** True during initial data load from repository */
  readonly bootLoading = computed(() => !this.hasLoaded());

  /**
   * Aggregate loading state for any operation.
   * True if any create/update/delete operation is in progress.
   */
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

  /**
   * Returns all tasks as a plain array (non-reactive).
   *
   * @returns Array of all tasks
   */
  getAll(): Task[] {
    return this.tasks();
  }

  /**
   * Finds a task by its ID.
   *
   * @param id - The task identifier
   * @returns The task object or undefined if not found
   */
  getById(id: string): Task | undefined {
    return this.tasks().find((t) => t.id === id);
  }

  /**
   * Checks if a specific task is currently being updated.
   *
   * @param id - The task identifier
   * @returns true if update operation is in progress for this task
   */
  isUpdating(id: string): boolean {
    return this._updatingIds().has(id) || this._updatingMany();
  }

  /**
   * Checks if a specific task is currently being deleted.
   *
   * @param id - The task identifier
   * @returns true if delete operation is in progress for this task
   */
  isDeleting(id: string): boolean {
    return this._deletingIds().has(id) || this._deletingMany();
  }

  /**
   * Creates a new task.
   *
   * Generates a UUID for the task and saves it to the repository.
   * Sets creating() signal during operation.
   *
   * @param task - Task data without id (will be generated)
   *
   * @example
   * await tasksService.create({
   *   title: 'Implement feature',
   *   description: 'Add new functionality',
   *   status: 'todo',
   *   priority: 'high'
   * });
   */
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

  /**
   * Updates a single task.
   *
   * Merges the patch with existing task data.
   * Sets per-task loading state accessible via isUpdating(id).
   *
   * @param id - The task identifier to update
   * @param patch - Partial task data with fields to change
   *
   * @example
   * // Update status only
   * await tasksService.update('task-id', { status: 'done' });
   *
   * @example
   * // Update multiple fields
   * await tasksService.update('task-id', {
   *   title: 'New title',
   *   priority: 'high'
   * });
   */
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

  /**
   * Deletes a single task.
   *
   * Sets per-task loading state accessible via isDeleting(id).
   *
   * @param id - The task identifier to delete
   */
  async delete(id: string) {
    this.addId(this._deletingIds, id);

    try {
      await this.simulate();

      await this.repo.delete(id);
    } finally {
      this.removeId(this._deletingIds, id);
    }
  }

  /**
   * Creates multiple tasks in parallel.
   *
   * More efficient than calling create() in a loop.
   * Sets creatingMany() signal during operation.
   *
   * @param tasks - Array of task data without ids
   */
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

  /**
   * Updates multiple tasks in parallel.
   *
   * Each task can have different fields updated.
   * Sets updatingMany() signal during operation.
   *
   * @param updates - Array of update objects with id and patch
   *
   * @example
   * await tasksService.updateMany([
   *   { id: '1', patch: { status: 'done' } },
   *   { id: '2', patch: { priority: 'high' } }
   * ]);
   */
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

  /**
   * Deletes multiple tasks in parallel.
   *
   * Sets deletingMany() signal during operation.
   *
   * @param ids - Array of task identifiers to delete
   */
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

  /**
   * Cycles task status through: todo → doing → done → todo.
   *
   * Convenience method for quick status updates.
   *
   * @param id - The task identifier
   *
   * @example
   * // Click handler to advance task status
   * <button (click)="tasksService.toggleStatus(task.id)">
   *   Advance Status
   * </button>
   */
  async toggleStatus(id: string) {
    const task = this.getById(id);
    if (!task) return;

    const order = ['todo', 'doing', 'done'] as const;
    const idx = order.indexOf(task.status);
    const nextStatus = order[(idx + 1) % order.length];

    await this.update(id, { status: nextStatus });
  }

  /**
   * Cycles status for multiple tasks simultaneously.
   *
   * Each task advances to its next status independently.
   *
   * @param ids - Array of task identifiers
   */
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

  /**
   * Reorders tasks based on new order of IDs.
   *
   * Updates the order field of tasks to match provided sequence.
   * Used after drag-and-drop reordering.
   *
   * @param orderedIds - Array of task IDs in desired order
   *
   * @example
   * // After drag and drop
   * onDrop(event: CdkDragDrop<Task[]>) {
   *   const newOrder = this.tasks.map(t => t.id);
   *   this.tasksService.reorder(newOrder);
   * }
   */
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
