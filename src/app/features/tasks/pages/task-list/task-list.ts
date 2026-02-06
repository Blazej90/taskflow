import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskCard } from '../../components/task-card/task-card';
import { Task, TaskStatus } from '../../task';
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
  tasks: Task[] = [];
  filter: Filter = 'all';

  constructor(private tasksService: TasksService) {
    this.refresh();
  }

  get filteredTasks(): Task[] {
    if (this.filter === 'all') return this.tasks;
    return this.tasks.filter((t) => t.status === this.filter);
  }

  setFilter(filter: Filter) {
    this.filter = filter;
  }

  removeTask(id: string) {
    this.tasksService.delete(id);
    this.refresh();
  }

  private refresh() {
    this.tasks = this.tasksService.getAll();
  }
}
