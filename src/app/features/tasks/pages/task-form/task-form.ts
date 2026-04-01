import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
export class TaskForm implements OnInit, OnDestroy {
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

  /** Minimum date for due date picker (today) */
  readonly minDate = new Date().toISOString().split('T')[0];

  private formPopulated = false;
  private checkInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.tasksService.load();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.taskId = id;

      // Check for task availability periodically until loaded or failed
      this.checkInterval = setInterval(() => {
        if (this.formPopulated) return;

        const task = this.tasksService.getById(id);
        if (task) {
          this.form.patchValue({
            title: task.title,
            description: task.description ?? '',
            priority: task.priority ?? 'medium',
            status: task.status,
            dueDate: task.dueDate ?? '',
          });
          this.formPopulated = true;
          clearInterval(this.checkInterval);
        } else if (!this.tasksService.bootLoading()) {
          // Finished loading but task not found
          this.formPopulated = true;
          clearInterval(this.checkInterval);
          this.toast.error('Task not found');
          this.router.navigateByUrl('/tasks');
        }
      }, 50);
    }
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
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

    if (dueDate && !this.isEdit) {
      const selected = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selected < today) {
        this.toast.error('Due date cannot be in the past');
        return;
      }
    }

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
