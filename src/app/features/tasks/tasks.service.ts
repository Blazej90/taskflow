import { Injectable } from '@angular/core';
import { Task } from './task';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private tasks: Task[] = [
    { id: '1', title: 'Zrobić layout TaskFlow', status: 'todo' },
    { id: '2', title: 'Dodać TaskCard', description: 'Input + template', status: 'doing' },
    { id: '3', title: 'Nauczyć się *ngFor', status: 'done' },
  ];

  getAll(): Task[] {
    return this.tasks;
  }

  getById(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  create(task: Omit<Task, 'id'>) {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
    };

    this.tasks.push(newTask);
  }

  update(id: string, updated: Omit<Task, 'id'>) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return;

    this.tasks[index] = {
      id,
      ...updated,
    };
  }
}
