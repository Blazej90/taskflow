import { Injectable } from '@angular/core';
import { Task } from './task';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private tasks: Task[] = [
    { id: '1', title: 'Zrobić layout TaskFlow', status: 'todo' },
    { id: '2', title: 'Dodać TaskCard', description: 'Input + template', status: 'doing' },
    { id: '3', title: 'Nauczyć się *ngFor', status: 'done' },
  ];

  getAll(): Task[] {
    return this.tasks;
  }
}
