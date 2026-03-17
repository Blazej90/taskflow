import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TasksService } from '../../tasks.service';
import { TaskStatus, Priority } from '../../task';
import { ToastService } from '@/shared/ui/toast/toast.service';

/** Shape of the task form values */
type TaskFormValue = {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
};

/**
 * Form for creating or editing a task.
 *
 * Supports two modes:
 * - Create mode: empty form for new task
 * - Edit mode: pre-filled form for existing task (based on route :id param)
 *
 * On successful submit, navigates back to task list.
 *
 * @example
 * // Routes configuration
 * { path: 'tasks/new', component: TaskForm }, // create mode
 * { path: 'tasks/:id/edit', component: TaskForm } // edit mode
 */
@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private tasksService = inject(TasksService);
  private router = inject(Router);
  private toast = inject(ToastService);

  /** True when editing existing task, false when creating new */
  isEdit = false;

  /** ID of task being edited, null when creating */
  taskId: string | null = null;

  /** Loading state from tasks service */
  readonly loading = this.tasksService.loading;

  /** Reactive form definition with validation */
  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    priority: ['medium' as Priority],
    status: ['todo' as TaskStatus],
    dueDate: [''],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.taskId = id;

      const task = this.tasksService.getById(id);
      if (task) {
        this.form.patchValue({
          title: task.title,
          description: task.description ?? '',
          priority: task.priority ?? 'medium',
          status: task.status,
          dueDate: task.dueDate ?? '',
        });
      } else {
        this.toast.error('Task not found');
        this.router.navigateByUrl('/tasks');
      }
    }
  }

  /**
   * Handles form submission.
   *
   * Validates form, creates or updates task based on mode,
   * shows success/error toast, and navigates to task list.
   */
  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, priority, status, dueDate } = this.form.getRawValue();

    try {
      if (this.isEdit && this.taskId) {
        await this.tasksService.update(this.taskId, { title, description, priority, status, dueDate });
        this.toast.success('Task updated');
      } else {
        await this.tasksService.create({ title, description, priority, status, dueDate });
        this.toast.success('Task created');
      }

      await this.router.navigateByUrl('/tasks');
    } catch {
      this.toast.error('Something went wrong');
    }
  }
}
