import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskCard } from '@/features/tasks/components/task-card/task-card';
import { Task, TaskStatus } from '../../../../task';

export interface BoardColumn {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  listId: string;
  connectedTo: string[];
  dotClass: string;
  emptyIcon: string;
}

@Component({
  selector: 'app-task-board-view',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCard],
  templateUrl: './task-board-view.html',
  styleUrl: './task-board-view.scss',
})
export class TaskBoardView {
  readonly columns = input.required<BoardColumn[]>();
  readonly isMobileView = input.required<boolean>();
  readonly activeColumn = input.required<number>();
  readonly selectMode = input.required<boolean>();
  readonly selectedIds = input.required<Set<string>>();

  readonly boardDrop = output<{ targetStatus: TaskStatus; event: CdkDragDrop<Task[]> }>();
  readonly boardScroll = output<Event>();
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
