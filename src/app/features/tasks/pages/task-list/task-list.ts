import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TaskCard } from '../../components/task-card/task-card';
import { Task } from '../../task';
import { TasksService } from '../../tasks.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskCard],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  tasks: Task[];

  constructor(private tasksService: TasksService) {
    this.tasks = this.tasksService.getAll();
  }

  removeTask(id: string) {
    this.tasksService.delete(id);
    this.tasks = this.tasksService.getAll();
  }
}
