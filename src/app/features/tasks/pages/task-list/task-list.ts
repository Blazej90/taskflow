import { Router } from '@angular/router';
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
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, signal, OnInit, OnDestroy, PLATFORM_ID, Renderer2 } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TaskCard } from '@/features/tasks/components/task-card/task-card';
import { Task, TaskStatus } from '../../task';
import { TasksService } from '../../tasks.service';

import { ToastService } from '@/shared/ui/toast/toast.service';
import { ConfirmService } from '@/shared/ui/confirm-dialog/confirm.service';

import { AuthService } from '@/features/auth/auth.service';

/** Filter option for task status */
type Filter = 'all' | TaskStatus;

/** Task sorting options */
type SortOption = 'manual' | 'newest' | 'oldest' | 'status' | 'priority';

/** Display mode for task list */
type ViewMode = 'list' | 'board';

/**
 * Main task list page with multiple views and bulk actions.
 *
 * Features:
 * - List view (sortable table/list) and Board view (Kanban columns)
 * - Filtering by status and text search
 * - Sorting by date, priority, status, or manual order
 * - Bulk selection and actions (delete, mark done)
 * - Drag & drop for reordering and status changes
 * - Mobile-responsive with swipeable board columns
 *
 * @example
 * // Routes configuration
 * { path: 'tasks', component: TaskList, canActivate: [authGuard] }
 */
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
export class TaskList implements OnInit, OnDestroy {
  private tasksService = inject(TasksService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private platformId = inject(PLATFORM_ID);
  private renderer = inject(Renderer2);

  /** All tasks from the service */
  readonly tasks = this.tasksService.tasks;

  /** Current status filter ('all' or specific status) */
  readonly statusFilter = signal<Filter>('all');

  /** Current search text for filtering by title */
  readonly searchTerm = signal('');

  /** Current sort option */
  readonly sortBy = signal<SortOption>('manual');

  /** Current view mode (list or board) */
  readonly viewMode = signal<ViewMode>('list');

  /** Whether bulk selection mode is active */
  readonly selectMode = signal(false);

  /** Set of selected task IDs for bulk actions */
  readonly selectedIds = signal<Set<string>>(new Set());

  /** True when sorting by manual order (enables drag & drop) */
  readonly isManualOrder = computed(() => this.sortBy() === 'manual');

  /** True when viewport is mobile width (≤768px) */
  readonly isMobileView = signal(false);

  /** Currently visible board column index (for mobile swipe) */
  readonly activeColumn = signal(0);

  /** True when page is scrolled down (shows scroll-to-top button) */
  readonly showScrollTop = signal(false);

  private readonly router = inject(Router);

  /** Auth service exposed for user info and logout */
  readonly auth = inject(AuthService);

  private cleanupResize?: () => void;
  private cleanupScroll?: () => void;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobile();
      this.cleanupResize = this.renderer.listen('window', 'resize', () => this.checkMobile());
      this.cleanupScroll = this.renderer.listen('window', 'scroll', () => this.onWindowScroll());
    }
  }

  ngOnDestroy() {
    this.cleanupResize?.();
    this.cleanupScroll?.();
  }

  private checkMobile() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView.set(window.innerWidth <= 768);
    }
  }

  /** Handles horizontal scroll on board to update active column indicator */
  onBoardScroll(event: Event) {
    const el = event.target as HTMLElement;
    const columnWidth = el.offsetWidth * 0.85;
    this.activeColumn.set(Math.round(el.scrollLeft / columnWidth));
  }

  private onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.showScrollTop.set(window.scrollY > 400);
    }
  }

  /** Scrolls window to top smoothly */
  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Logs out user and redirects to auth page */
  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/auth');
  }

  /** Changes view mode between list and board */
  setViewMode(mode: ViewMode) {
    this.viewMode.set(mode);
  }

  /** Toggles bulk selection mode and clears selection when exiting */
  toggleSelectMode() {
    const next = !this.selectMode();
    this.selectMode.set(next);

    if (!next) {
      this.selectedIds.set(new Set());
    }
  }

  /** Updates selection state for a task */
  onSelectedChange(e: { id: string; selected: boolean }) {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (e.selected) next.add(e.id);
      else next.delete(e.id);
      return next;
    });
  }

  /** Checks if a task is currently selected */
  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  /** Number of currently selected tasks */
  readonly selectedCount = computed(() => this.selectedIds().size);

  /** Filtered and sorted tasks based on current filter/sort settings */
  readonly filteredTasks = computed(() => {
    const f = this.statusFilter();
    const q = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();
    const tasks = this.tasks();

    const byStatus = f === 'all' ? tasks : tasks.filter((t) => t.status === f);
    const bySearch = !q ? byStatus : byStatus.filter((t) => t.title.toLowerCase().includes(q));

    if (sort === 'manual') return bySearch;

    const sorted = [...bySearch];

    if (sort === 'newest') return sorted.reverse();
    if (sort === 'oldest') return sorted;

    if (sort === 'status') {
      const order = ['todo', 'doing', 'done'];
      return sorted.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    }

    if (sort === 'priority') {
      const order = ['high', 'medium', 'low'];
      return sorted.sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
    }

    return sorted;
  });

  // Board column computed signals
  readonly boardTodo = computed(() => this.filteredTasks().filter((t) => t.status === 'todo'));
  readonly boardDoing = computed(() => this.filteredTasks().filter((t) => t.status === 'doing'));
  readonly boardDone = computed(() => this.filteredTasks().filter((t) => t.status === 'done'));

  /** Board column configuration for template rendering */
  readonly columns = computed(() => [
    {
      status: 'todo' as const,
      label: 'Todo',
      tasks: this.boardTodo(),
      listId: 'todoList',
      connectedTo: ['doingList', 'doneList'],
      dotClass: 'dot-todo',
      emptyIcon: 'plus',
    },
    {
      status: 'doing' as const,
      label: 'Doing',
      tasks: this.boardDoing(),
      listId: 'doingList',
      connectedTo: ['todoList', 'doneList'],
      dotClass: 'dot-doing',
      emptyIcon: 'circle',
    },
    {
      status: 'done' as const,
      label: 'Done',
      tasks: this.boardDone(),
      listId: 'doneList',
      connectedTo: ['todoList', 'doingList'],
      dotClass: 'dot-done',
      emptyIcon: 'check',
    },
  ]);

  /** Sets status filter value */
  setFilter(next: Filter) {
    this.statusFilter.set(next);
  }

  /**
   * Deletes a task after confirmation.
   * Shows toast notification on success/failure.
   */
  async removeTask(id: string) {
    try {
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
    } catch {
      this.toast.error('Failed to delete task');
    }
  }

  /** Toggles task status (todo → doing → done → todo) */
  async toggleTaskStatus(id: string) {
    try {
      await this.tasksService.toggleStatus(id);
    } catch {
      this.toast.error('Failed to update task');
    }
  }

  // Task count computed signals
  readonly totalCount = computed(() => this.tasks().length);
  readonly todoCount = computed(() => this.tasks().filter((t) => t.status === 'todo').length);
  readonly doingCount = computed(() => this.tasks().filter((t) => t.status === 'doing').length);
  readonly doneCount = computed(() => this.tasks().filter((t) => t.status === 'done').length);

  readonly isEmpty = computed(() => this.filteredTasks().length === 0);
  readonly loading = this.tasksService.loading;

  /**
   * Deletes all selected tasks after confirmation.
   * Exits select mode on completion.
   */
  async bulkDelete() {
    try {
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
      await this.tasksService.deleteMany(ids);

      this.toast.success(`${ids.length} tasks deleted`);
      this.selectedIds.set(new Set());
      this.selectMode.set(false);
    } catch {
      this.toast.error('Failed to delete tasks');
    }
  }

  /**
   * Marks all selected tasks as done after confirmation.
   * Exits select mode on completion.
   */
  async bulkMarkDone() {
    try {
      const ids = Array.from(this.selectedIds());
      if (ids.length === 0) return;

      const confirmed = await this.confirm.open({
        title: 'Update tasks',
        message: `Mark ${ids.length} selected tasks as DONE?`,
        confirmText: 'Update',
        cancelText: 'Cancel',
      });

      if (!confirmed) return;

      const updates = ids.map((id) => ({ id, patch: { status: 'done' as const } }));
      await this.tasksService.updateMany(updates);

      this.toast.success(`${ids.length} tasks updated`);
      this.selectedIds.set(new Set());
      this.selectMode.set(false);
    } catch {
      this.toast.error('Failed to update tasks');
    }
  }

  /**
   * Handles drag & drop reordering in list view.
   * Only works in manual sort mode.
   */
  onDrop(event: CdkDragDrop<Task[]>) {
    if (!this.isManualOrder()) return;
    if (event.previousIndex === event.currentIndex) return;

    const visible = [...this.filteredTasks()];
    moveItemInArray(visible, event.previousIndex, event.currentIndex);

    this.tasksService.reorder(visible.map((t) => t.id));
    this.toast.success('Order saved');
  }

  /**
   * Handles drag & drop between board columns.
   * Updates task status when moved to different column.
   */
  async onBoardDrop(targetStatus: TaskStatus, event: CdkDragDrop<Task[]>) {
    try {
      if (event.previousContainer === event.container && event.previousIndex === event.currentIndex)
        return;

      if (event.previousContainer === event.container) {
        const next = [...event.container.data];
        moveItemInArray(next, event.previousIndex, event.currentIndex);
        return;
      }

      const movedTask = event.previousContainer.data[event.previousIndex];
      if (!movedTask) return;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      await this.tasksService.update(movedTask.id, { status: targetStatus });

      this.toast.success(`Moved to ${targetStatus.toUpperCase()}`);
    } catch {
      this.toast.error('Failed to move task');
    }
  }
}
