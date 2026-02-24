import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TasksService } from '../../tasks.service';
import { TaskStatus, Priority } from '../../task';
import { ToastService } from '@/shared/ui/toast/toast.service';

type TaskFormValue = {
  title: string;
  description: string;
  priority: Priority;
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
    priority: ['medium' as Priority],
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
          priority: task.priority ?? 'medium', // DODAJ TO
          status: task.status,
        });
      } else {
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

    const { title, description, priority, status } = this.form.getRawValue();

    try {
      if (this.isEdit && this.taskId) {
        await this.tasksService.update(this.taskId, { title, description, priority, status });
        this.toast.success('Task updated');
      } else {
        await this.tasksService.create({ title, description, priority, status });
        this.toast.success('Task created');
      }

      await this.router.navigateByUrl('/tasks');
    } catch {
      this.toast.error('Something went wrong');
    }
  }
}
