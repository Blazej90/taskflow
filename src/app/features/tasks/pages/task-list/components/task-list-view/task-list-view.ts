import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskCard } from '@/features/tasks/components/task-card/task-card';
import { Task } from '../../../../task';

@Component({
  selector: 'app-task-list-view',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCard],
  templateUrl: './task-list-view.html',
  styleUrl: './task-list-view.scss',
})
export class TaskListView {
  readonly tasks = input.required<Task[]>();
  readonly isManualOrder = input.required<boolean>();
  readonly selectMode = input.required<boolean>();
  readonly selectedIds = input.required<Set<string>>();

  readonly drop = output<CdkDragDrop<Task[]>>();
  readonly selectedChange = output<{ id: string; selected: boolean }>();
  readonly remove = output<string>();
  readonly toggle = output<string>();

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  isDueToday(dueDate: string | undefined): boolean {
    if (!dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate === today;
  }

  isOverdue(dueDate: string | undefined): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }
}
