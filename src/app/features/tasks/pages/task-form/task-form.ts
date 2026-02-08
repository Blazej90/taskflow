import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TasksService } from '../../tasks.service';
import { TaskStatus } from '../../task';
import { ToastService } from '@/shared/ui/toast/toast.service';

type TaskFormValue = {
  title: string;
  description: string;
  status: TaskStatus;
};

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

  isEdit = false;
  taskId: string | null = null;

  readonly loading = this.tasksService.loading;

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    status: ['todo' as TaskStatus],
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
          status: task.status,
        });
      } else {
        // edge case: /tasks/:id/edit but task is missing
        this.toast.error('Task not found');
        this.router.navigateByUrl('/tasks');
      }
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as TaskFormValue;

    try {
      if (this.isEdit && this.taskId) {
        await this.tasksService.update(this.taskId, value);
        this.toast.success('Task updated');
      } else {
        await this.tasksService.create(value);
        this.toast.success('Task created');
      }

      await this.router.navigateByUrl('/tasks');
    } catch {
      this.toast.error('Something went wrong');
    }
  }
}
