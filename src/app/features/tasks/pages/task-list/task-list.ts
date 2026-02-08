import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TaskCard } from '@/features/tasks/components/task-card/task-card';
import { Task, TaskStatus } from '../../task';
import { TasksService } from '../../tasks.service';

import { ToastService } from '@/shared/ui/toast/toast.service';
import { ConfirmService } from '@/shared/ui/confirm-dialog/confirm.service';

type Filter = 'all' | TaskStatus;
type SortOption = 'manual' | 'newest' | 'oldest' | 'status';
type ViewMode = 'list' | 'board';

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
    DragDropModule,
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  private tasksService = inject(TasksService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly tasks = this.tasksService.tasks;

  readonly viewMode = signal<ViewMode>('list');

  readonly statusFilter = signal<Filter>('all');
  readonly searchTerm = signal('');
  readonly sortBy = signal<SortOption>('manual');

  readonly selectMode = signal(false);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly isManualOrder = computed(() => this.sortBy() === 'manual');

  // --- selection mode ---
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

  // --- list view computed ---
  readonly filteredTasks = computed(() => {
    const f = this.statusFilter();
    const q = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();
    const tasks = this.tasks();

    const byStatus = f === 'all' ? tasks : tasks.filter((t) => t.status === f);
    const bySearch = !q ? byStatus : byStatus.filter((t) => t.title.toLowerCase().includes(q));

    // MANUAL: zostawiamy kolejność jak w serwisie
    if (sort === 'manual') return bySearch;

    const sorted = [...bySearch];

    if (sort === 'newest') return sorted.reverse();
    if (sort === 'oldest') return sorted;

    if (sort === 'status') {
      const order = ['todo', 'doing', 'done'];
      return sorted.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    }

    return sorted;
  });

  // --- board view computed (kolumny) ---
  readonly boardTodo = computed(() => this.applyBoardFilters('todo'));
  readonly boardDoing = computed(() => this.applyBoardFilters('doing'));
  readonly boardDone = computed(() => this.applyBoardFilters('done'));

  private applyBoardFilters(status: TaskStatus): Task[] {
    const q = this.searchTerm().trim().toLowerCase();
    const f = this.statusFilter();
    const tasks = this.tasks();

    // jak user ustawi filtr statusu, to na boardzie pokazujemy tylko ten status (albo all)
    if (f !== 'all' && f !== status) return [];

    const byStatus = tasks.filter((t) => t.status === status);

    if (!q) return byStatus;
    return byStatus.filter((t) => t.title.toLowerCase().includes(q));
  }

  setFilter(next: Filter) {
    this.statusFilter.set(next);
  }

  // --- actions ---
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

  readonly isEmpty = computed(() => {
    if (this.viewMode() === 'board') {
      return this.boardTodo().length + this.boardDoing().length + this.boardDone().length === 0;
    }
    return this.filteredTasks().length === 0;
  });

  readonly loading = this.tasksService.loading;

  // --- bulk ---
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

  // --- list drag (manual order) ---
  onDrop(event: CdkDragDrop<Task[]>) {
    if (!this.isManualOrder()) return;
    if (event.previousIndex === event.currentIndex) return;

    const visible = [...this.filteredTasks()];
    moveItemInArray(visible, event.previousIndex, event.currentIndex);

    this.tasksService.reorder(visible.map((t) => t.id));
    this.toast.success('Order saved');
  }

  // --- board drag (status + kolejność w kolumnach) ---
  async onBoardDrop(nextStatus: TaskStatus, event: CdkDragDrop<Task[]>) {
    if (this.loading()) return;

    // tablice robocze – w cdkDropListData będziemy podawać konkretną listę z kolumny
    const source = event.previousContainer.data;
    const target = event.container.data;

    if (event.previousContainer === event.container) {
      // reorder w tej samej kolumnie (tylko UI + zapis kolejności globalnej)
      moveItemInArray(target, event.previousIndex, event.currentIndex);
    } else {
      // przeniesienie między kolumnami
      transferArrayItem(source, target, event.previousIndex, event.currentIndex);

      const moved = target[event.currentIndex];
      if (moved && moved.status !== nextStatus) {
        await this.tasksService.update(moved.id, {
          title: moved.title,
          description: moved.description ?? '',
          status: nextStatus,
        });
      }
    }

    // zapisujemy globalną kolejność jako: todo -> doing -> done (wg widoku board)
    const ids = [
      ...this.boardTodo().map((t) => t.id),
      ...this.boardDoing().map((t) => t.id),
      ...this.boardDone().map((t) => t.id),
    ];

    this.tasksService.reorder(ids);
  }
}
