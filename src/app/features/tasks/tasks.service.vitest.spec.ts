import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { DestroyRef, signal } from '@angular/core';
import { Observable } from 'rxjs';

vi.mock('@angular/core/rxjs-interop', () => ({
  takeUntilDestroyed:
    () =>
    <T>(source: Observable<T>) =>
      source,
}));

import { TasksService } from './tasks.service';
import { TasksRepository } from './task.repository';
import { Task } from './task';

function createFakeDestroyRef(): DestroyRef {
  const callbacks: Array<() => void> = [];
  const destroyed = signal(false);

  return {
    destroyed: destroyed.asReadonly(),
    onDestroy(callback: () => void): () => void {
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      };
    },
  } as unknown as DestroyRef;
}

class InMemoryTasksRepository implements TasksRepository {
  private store: Task[] | null = null;

  private readonly subject = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this.subject.asObservable();

  load(): void {
    this.subject.next(this.store ?? []);
  }

  unload(): void {}

  save(tasks: Task[]): void {
    this.store = tasks;
    this.subject.next(tasks);
  }

  async create(task: Task): Promise<void> {
    const current = this.subject.value;
    this.save([...current, task]);
  }

  async update(task: Task): Promise<void> {
    const next = this.subject.value.map((t) => (t.id === task.id ? task : t));
    this.save(next);
  }

  async delete(id: string): Promise<void> {
    const next = this.subject.value.filter((t) => t.id !== id);
    this.save(next);
  }

  async reorder(tasks: Task[]): Promise<void> {
    this.save(tasks);
  }
}

function makeService(repo?: TasksRepository) {
  const r = repo ?? new InMemoryTasksRepository();
  const destroyRef = createFakeDestroyRef();
  const service = new TasksService(r as any, destroyRef);
  return { service, repo: r, destroyRef };
}

describe('TasksService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('seeds tasks on init when repo is empty', async () => {
    const repo = new InMemoryTasksRepository();
    repo.save([
      {
        id: 'seed-1',
        title: 'Welcome task',
        description: 'Hello',
        status: 'todo',
        priority: 'medium',
      },
      {
        id: 'seed-2',
        title: 'Another task',
        description: 'World',
        status: 'doing',
        priority: 'high',
      },
    ]);

    const { service } = makeService(repo);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.getAll().length).toBeGreaterThan(0);
  });

  it('create() adds new task', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'new-id' } as any);

    const { service } = makeService();

    const before = service.getAll().length;

    await service.create({
      title: 'Test task',
      description: '',
      status: 'todo',
      priority: 'medium',
    });

    const tasks = service.getAll();
    expect(tasks.length).toBe(before + 1);
    expect(tasks.some((t) => t.id === 'new-id')).toBe(true);
  });

  it('update() edits task', async () => {
    const repo = new InMemoryTasksRepository();
    repo.save([{ id: '1', title: 'Old', description: '', status: 'todo', priority: 'low' }]);

    const { service } = makeService(repo);

    await service.update('1', {
      title: 'New',
      description: 'desc',
      status: 'doing',
    });

    const task = service.getById('1')!;
    expect(task.title).toBe('New');
    expect(task.status).toBe('doing');
  });

  it('delete() removes task', async () => {
    const repo = new InMemoryTasksRepository();
    repo.save([
      { id: '1', title: 'A', description: '', status: 'todo', priority: 'medium' },
      { id: '2', title: 'B', description: '', status: 'todo', priority: 'low' },
    ]);

    const { service } = makeService(repo);

    await service.delete('1');

    expect(service.getById('1')).toBeUndefined();
    expect(service.getAll().length).toBe(1);
  });

  it('toggleStatus cycles todo → doing → done → todo', async () => {
    const repo = new InMemoryTasksRepository();
    repo.save([{ id: '1', title: 'A', description: '', status: 'todo', priority: 'medium' }]);

    const { service } = makeService(repo);

    await service.toggleStatus('1');
    expect(service.getById('1')?.status).toBe('doing');

    await service.toggleStatus('1');
    expect(service.getById('1')?.status).toBe('done');

    await service.toggleStatus('1');
    expect(service.getById('1')?.status).toBe('todo');
  });

  it('sets per-task loading flags during delete()', async () => {
    const repo = new InMemoryTasksRepository();
    repo.save([{ id: '1', title: 'A', description: '', status: 'todo', priority: 'medium' }]);

    const originalDelete = repo.delete.bind(repo);
    let resolveDelete!: () => void;
    repo.delete = vi.fn(() => new Promise<void>((resolve) => (resolveDelete = resolve)));

    const { service } = makeService(repo);

    const promise = service.delete('1');

    expect(service.isDeleting('1')).toBe(true);
    expect(service.loading()).toBe(true);

    resolveDelete();
    await promise;

    expect(service.isDeleting('1')).toBe(false);
    expect(service.loading()).toBe(false);

    repo.delete = originalDelete;
  });
});
