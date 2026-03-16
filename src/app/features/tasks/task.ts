/**
 * Represents the current status of a task in the workflow.
 * - 'todo': Task is queued and waiting to be started
 * - 'doing': Task is currently being worked on
 * - 'done': Task has been completed
 */
export type TaskStatus = 'todo' | 'doing' | 'done';

/**
 * Represents the priority level of a task.
 * - 'low': Can be addressed later, not urgent
 * - 'medium': Normal priority, should be done in reasonable time
 * - 'high': Urgent and important, requires immediate attention
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * Represents a single task in the TaskFlow application.
 *
 * @example
 * const task: Task = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   title: 'Implement user authentication',
 *   description: 'Add login and register functionality',
 *   status: 'doing',
 *   priority: 'high',
 *   order: 1
 * };
 */
export interface Task {
  /** Unique identifier for the task (UUID format) */
  id: string;

  /** Brief title describing the task (displayed in lists and board) */
  title: string;

  /** Optional detailed description with additional information about the task */
  description?: string;

  /** Current status of the task in the workflow */
  status: TaskStatus;

  /** Priority level indicating task urgency */
  priority: Priority;

  /**
   * Optional ordering index for manual task ordering.
   * Lower values appear first in the list.
   * When undefined, tasks are sorted by creation date.
   */
  order?: number;
}
