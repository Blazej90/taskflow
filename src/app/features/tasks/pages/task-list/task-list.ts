import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Task } from '../../task';
import { TaskCard } from '../../components/task-card/task-card';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskCard],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList {
  tasks: Task[] = [
    { id: '1', title: 'Zrobić layout TaskFlow', status: 'todo' },
    { id: '2', title: 'Dodać TaskCard', description: 'Input + template', status: 'doing' },
    { id: '3', title: 'Nauczyć się *ngFor', status: 'done' },
  ];
}
