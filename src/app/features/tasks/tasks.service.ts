import { Inject, Injectable } from '@angular/core';
import { Task } from './task';
import { LocalStorageTasksRepository } from './local-storage-tasks.repository';
import { TASKS_REPOSITORY, TasksRepository } from './task.repository';

const SEED_TASKS: Task[] = [
  { id: '1', title: 'Zrobić layout TaskFlow', status: 'todo' },
  { id: '2', title: 'Dodać TaskCard', description: 'Input + template', status: 'doing' },
  { id: '3', title: 'Nauczyć się *ngFor', status: 'done' },
];

@Injectable({ providedIn: 'root' })
export class TasksService {
  private tasks: Task[];

  constructor(@Inject(TASKS_REPOSITORY) private repo: TasksRepository) {
    this.tasks = this.repo.load() ?? SEED_TASKS;
    this.repo.save(this.tasks);
  }

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

    this.tasks = [...this.tasks, newTask];
    this.repo.save(this.tasks);
  }

  update(id: string, updated: Omit<Task, 'id'>) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return;

    const next = [...this.tasks];
    next[index] = { id, ...updated };

    this.tasks = next;
    this.repo.save(this.tasks);
  }

  delete(id: string) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.repo.save(this.tasks);
  }
}
