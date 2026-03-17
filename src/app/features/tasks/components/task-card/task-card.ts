import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DateFormatPipe } from '@/shared/pipes/date-format.pipe';
import { Task } from '../../task';
import { TasksService } from '../../tasks.service';

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
export class TaskCard {
  private tasksService = inject(TasksService);

  /** The task data to display (required) */
  @Input({ required: true }) task!: Task;

  /** Whether the card shows a checkbox for selection mode */
  @Input() selectable = false;

  /** Whether the task is currently selected (checkbox state) */
  @Input() selected = false;

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
}
