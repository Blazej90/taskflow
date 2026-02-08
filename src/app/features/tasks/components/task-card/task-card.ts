import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Task } from '../../task';
import { TasksService } from '../../tasks.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  private tasksService = inject(TasksService);

  @Input({ required: true }) task!: Task;

  @Input() selectable = false;
  @Input() selected = false;

  @Output() selectedChange = new EventEmitter<{ id: string; selected: boolean }>();

  @Output() remove = new EventEmitter<string>();
  @Output() toggle = new EventEmitter<string>();

  get isDeleting(): boolean {
    return this.tasksService.isDeleting(this.task.id);
  }

  get isUpdating(): boolean {
    return this.tasksService.isUpdating(this.task.id);
  }

  get isBusy(): boolean {
    return this.isDeleting || this.isUpdating;
  }

  onToggleSelected(next: boolean) {
    this.selectedChange.emit({ id: this.task.id, selected: next });
  }
}
