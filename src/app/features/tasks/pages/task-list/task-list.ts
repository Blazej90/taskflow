import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskCard } from '../../components/task-card/task-card';
import { TaskStatus } from '../../task';
import { TasksService } from '../../tasks.service';

type Filter = 'all' | TaskStatus;

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TaskCard],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  private tasksService = inject(TasksService);

  readonly tasks = this.tasksService.tasks;
  readonly statusFilter = signal<Filter>('all');

  readonly filteredTasks = computed(() => {
    const f = this.statusFilter();
    const tasks = this.tasks();
    return f === 'all' ? tasks : tasks.filter((t) => t.status === f);
  });

  setFilter(next: Filter) {
    this.statusFilter.set(next);
  }

  async removeTask(id: string) {
    await this.tasksService.delete(id);
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
}
