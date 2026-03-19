import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DateFormatPipe } from '@/shared/pipes/date-format.pipe';
import { Task } from '../../task';
import { TasksService } from '../../tasks.service';

interface DaysRemaining {
  days: number;
  label: string;
  urgent: boolean;
  overdue: boolean;
}

/**
 * Displays a single task with actions and optional selection.
 *
 * Visual representation of a task showing title, description,
 * status, priority, and action buttons. Can operate in selectable
 * mode for bulk operations.
 *
 * @example
 * // Basic usage
 * <app-task-card
 *   [task]="task"
 *   (remove)="onDelete($event)"
 *   (toggle)="onToggle($event)">
 * </app-task-card>
 *
 * @example
 * // With selection mode (for bulk actions)
 * <app-task-card
 *   [task]="task"
 *   [selectable]="true"
 *   [selected]="isSelected(task.id)"
 *   (selectedChange)="onSelectionChange($event)"
 *   (remove)="onDelete($event)"
 *   (toggle)="onToggle($event)">
 * </app-task-card>
 */
@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DateFormatPipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard implements OnInit, OnDestroy {
  private tasksService = inject(TasksService);

  private currentDate = signal(new Date());
  private intervalId?: ReturnType<typeof setInterval>;
  
  /** Tracks if task is being marked as done (for animation) */
  readonly isCompleting = signal(false);

  daysRemaining = computed<DaysRemaining | null>(() => {
    if (!this.task.dueDate || this.task.status === 'done') return null;

    const due = new Date(this.task.dueDate);
    due.setHours(0, 0, 0, 0);
    
    const today = this.currentDate();
    today.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: Math.abs(diffDays), label: 'days overdue', urgent: true, overdue: true };
    }
    if (diffDays === 0) {
      return { days: 0, label: 'Due today', urgent: true, overdue: false };
    }
    if (diffDays === 1) {
      return { days: 1, label: 'day left', urgent: true, overdue: false };
    }
    return { days: diffDays, label: 'days left', urgent: diffDays <= 3, overdue: false };
  });

  /** The task data to display (required) */
  @Input({ required: true }) task!: Task;

  /** Whether the card shows a checkbox for selection mode */
  @Input() selectable = false;

  /** Whether the task is currently selected (checkbox state) */
  @Input() selected = false;

  /** Whether to highlight the card (e.g., task due today) */
  @Input() highlight = false;

  /** Whether the task is overdue (for visual warning) */
  @Input() overdue = false;

  /** Current view mode - animation only works in board view */
  @Input() viewMode: 'list' | 'board' = 'list';

  /**
   * Emitted when selection state changes.
   * Contains task id and new selected state.
   */
  @Output() selectedChange = new EventEmitter<{ id: string; selected: boolean }>();

  /** Emitted when user requests task deletion (carries task id) */
  @Output() remove = new EventEmitter<string>();

  /** Emitted when user toggles task status (carries task id) */
  @Output() toggle = new EventEmitter<string>();

  /** True if this task is currently being deleted */
  get isDeleting(): boolean {
    return this.tasksService.isDeleting(this.task.id);
  }

  /** True if this task is currently being updated */
  get isUpdating(): boolean {
    return this.tasksService.isUpdating(this.task.id);
  }

  /** True if any async operation is in progress on this task */
  get isBusy(): boolean {
    return this.isDeleting || this.isUpdating;
  }

  /** Handles checkbox toggle, emits selection change event */
  onToggleSelected(next: boolean) {
    this.selectedChange.emit({ id: this.task.id, selected: next });
  }

  /** Handles marking task as done with animation */
  onComplete(): void {
    if (this.task.status === 'done') {
      // If already done, just toggle normally
      this.toggle.emit(this.task.id);
      return;
    }
    
    // Animation only in board view
    if (this.viewMode === 'board') {
      this.isCompleting.set(true);
      setTimeout(() => {
        this.toggle.emit(this.task.id);
      }, 800);
    } else {
      // List view - no animation, immediate toggle
      this.toggle.emit(this.task.id);
    }
  }

  /** Returns exclamation marks for priority level */
  getPriorityMarks(priority: string): string {
    const marks: Record<string, string> = {
      low: '!',
      medium: '!!',
      high: '!!!'
    };
    return marks[priority] || '!';
  }

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentDate.set(new Date());
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
