import { MatSelectModule } from '@angular/material/select';
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
type SortOption = 'newest' | 'oldest' | 'status';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TaskCard,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
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
  readonly sortBy = signal<SortOption>('newest');

  readonly selectMode = signal(false);
  readonly selectedIds = signal<Set<string>>(new Set());

  toggleSelectMode() {
    const next = !this.selectMode();
    this.selectMode.set(next);

    if (!next) {
      this.selectedIds.set(new Set());
    }
  }

  onSelectedChange(e: { id: string; selected: boolean }) {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (e.selected) next.add(e.id);
      else next.delete(e.id);
      return next;
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly filteredTasks = computed(() => {
    const f = this.statusFilter();
    const q = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();
    const tasks = this.tasks();

    const byStatus = f === 'all' ? tasks : tasks.filter((t) => t.status === f);

    const bySearch = !q ? byStatus : byStatus.filter((t) => t.title.toLowerCase().includes(q));

    const sorted = [...bySearch];

    if (sort === 'newest') return sorted.reverse();
    if (sort === 'oldest') return sorted;

    if (sort === 'status') {
      const order = ['todo', 'doing', 'done'];
      return sorted.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    }

    return sorted;
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

  async bulkDelete() {
    const count = this.selectedCount();
    if (count === 0) return;

    const confirmed = await this.confirm.open({
      title: 'Delete tasks',
      message: `Are you sure you want to delete ${count} selected tasks?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    const ids = Array.from(this.selectedIds());

    for (const id of ids) {
      await this.tasksService.delete(id);
    }

    this.toast.success(`${ids.length} tasks deleted`);

    this.selectedIds.set(new Set());
    this.selectMode.set(false);
  }

  async bulkMarkDone() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const confirmed = await this.confirm.open({
      title: 'Update tasks',
      message: `Mark ${ids.length} selected tasks as DONE?`,
      confirmText: 'Update',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    for (const id of ids) {
      const task = this.tasksService.getById(id);
      if (!task) continue;

      await this.tasksService.update(id, {
        title: task.title,
        description: task.description ?? '',
        status: 'done',
      });
    }

    this.toast.success(`${ids.length} tasks updated`);

    this.selectedIds.set(new Set());
    this.selectMode.set(false);
  }
}
