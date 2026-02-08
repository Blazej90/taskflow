import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TaskCard } from '@/features/tasks/components/task-card/task-card';
import { TaskStatus } from '../../task';
import { TasksService } from '../../tasks.service';

import { ToastService } from '@/shared/ui/toast/toast.service';
import { ConfirmService } from '@/shared/ui/confirm-dialog/confirm.service';

type Filter = 'all' | TaskStatus;

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TaskCard, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  private tasksService = inject(TasksService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly tasks = this.tasksService.tasks;
  readonly statusFilter = signal<Filter>('all');
  readonly searchTerm = signal('');

  readonly filteredTasks = computed(() => {
    const f = this.statusFilter();
    const q = this.searchTerm().trim().toLowerCase();
    const tasks = this.tasks();

    const byStatus = f === 'all' ? tasks : tasks.filter((t) => t.status === f);
    if (!q) return byStatus;

    return byStatus.filter((t) => t.title.toLowerCase().includes(q));
  });

  setFilter(next: Filter) {
    this.statusFilter.set(next);
  }

  async removeTask(id: string) {
    const task = this.tasksService.getById(id);

    const confirmed = await this.confirm.open({
      title: 'Delete task',
      message: `Are you sure you want to delete "${task?.title ?? 'this task'}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    await this.tasksService.delete(id);
    this.toast.success('Task deleted');
  }

  async toggleTaskStatus(id: string) {
    await this.tasksService.toggleStatus(id);
  }

  readonly totalCount = computed(() => this.tasks().length);
  readonly todoCount = computed(() => this.tasks().filter((t) => t.status === 'todo').length);
  readonly doingCount = computed(() => this.tasks().filter((t) => t.status === 'doing').length);
  readonly doneCount = computed(() => this.tasks().filter((t) => t.status === 'done').length);

  readonly isEmpty = computed(() => this.filteredTasks().length === 0);

  readonly loading = this.tasksService.loading;
}
