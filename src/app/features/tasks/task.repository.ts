import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from './task';

/**
 * Repository interface for task data persistence operations.
 *
 * This interface abstracts the data layer, allowing different implementations
 * (localStorage, Firestore, REST API, etc.) to be swapped without changing
 * the application logic.
 *
 * @example
 * // Using the repository with dependency injection
 * constructor(@Inject(TASKS_REPOSITORY) private repo: TasksRepository) {}
 *
 * @example
 * // Creating a custom implementation
 * class LocalStorageTasksRepository implements TasksRepository {
 *   tasks$ = new BehaviorSubject<Task[]>([]);
 *   load() { /* load from storage *\/ }
 *   // ... implement other methods
 * }
 */
export interface TasksRepository {
  /**
   * Observable stream of all tasks.
   * Emits whenever the task list changes.
   * Components should subscribe to this for reactive updates.
   */
  tasks$: Observable<Task[]>;

  /**
   * Initializes the repository and loads initial data.
   * Should be called once when the application starts.
   * Triggers an emission on tasks$ when data is loaded.
   */
  load(): void;

  /**
   * Cleans up resources and unsubscribes from any streams.
   * Should be called when the repository is no longer needed
   * to prevent memory leaks.
   */
  unload(): void;

  /**
   * Saves the entire task list (used for bulk updates).
   * This will replace the current state with the provided tasks.
   *
   * @param tasks - Complete array of tasks to save
   */
  save(tasks: Task[]): void;

  /**
   * Creates a new task in the repository.
   *
   * @param task - The task to create (must have a unique id)
   * @returns Promise that resolves when the task is saved
   */
  create(task: Task): Promise<void>;

  /**
   * Updates an existing task.
   *
   * @param task - The task with updated fields (id must match existing task)
   * @returns Promise that resolves when the update is saved
   */
  update(task: Task): Promise<void>;

  /**
   * Deletes a task by its id.
   *
   * @param id - The unique identifier of the task to delete
   * @returns Promise that resolves when the deletion is complete
   */
  delete(id: string): Promise<void>;

  /**
   * Reorders tasks by updating their order indices.
   * Used after drag-and-drop operations to persist the new order.
   *
   * @param tasks - Array of tasks with updated order values
   * @returns Promise that resolves when the reordering is saved
   */
  reorder(tasks: Task[]): Promise<void>;
}

/**
 * Injection token for providing task repository implementations.
 *
 * Use this token to inject the repository into services or components:
 * ```typescript
 * constructor(@Inject(TASKS_REPOSITORY) private repo: TasksRepository) {}
 * ```
 *
 * The actual implementation is configured in app.config.ts:
 * ```typescript
 * { provide: TASKS_REPOSITORY, useClass: FirestoreTasksRepository }
 * ```
 */
export const TASKS_REPOSITORY = new InjectionToken<TasksRepository>('TASKS_REPOSITORY');
