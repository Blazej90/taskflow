import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { Task } from '../../task';
import { TaskCard } from '../../components/task-card/task-card';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [NgFor, TaskCard],
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
