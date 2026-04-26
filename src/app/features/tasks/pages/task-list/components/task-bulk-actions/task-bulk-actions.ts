import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-bulk-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-bulk-actions.html',
  styleUrl: './task-bulk-actions.scss',
})
export class TaskBulkActions {
  readonly selectedCount = input.required<number>();
  readonly cancel = output<void>();
  readonly markDone = output<void>();
  readonly delete = output<void>();
}
