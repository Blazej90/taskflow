import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Filter, DateFilter, SortOption } from '../../task-list.types';

@Component({
  selector: 'app-task-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-toolbar.html',
  styleUrl: './task-toolbar.scss',
})
export class TaskToolbar {
  // Filters
  readonly statusFilter = input.required<Filter>();
  readonly totalCount = input.required<number>();
  readonly todoCount = input.required<number>();
  readonly doingCount = input.required<number>();
  readonly doneCount = input.required<number>();
  readonly filterChange = output<Filter>();

  // Date banners
  readonly overdueCount = input.required<number>();
  readonly dueTodayCount = input.required<number>();
  readonly showOverdue = output<void>();
  readonly showDueToday = output<void>();

  // Search & sort
  readonly searchTerm = input.required<string>();
  readonly sortBy = input.required<SortOption>();
  readonly searchChange = output<string>();
  readonly sortChange = output<SortOption>();

  // Active date filter
  readonly dateFilter = input.required<DateFilter>();
  readonly clearDateFilter = output<void>();

  protected readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'manual', label: 'Manual (drag)' },
    { value: 'dueDate', label: 'Due date (urgency)' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
  ];
}
