import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject, Observable } from 'rxjs';
import { DestroyRef, signal } from '@angular/core';

vi.mock('@angular/core/rxjs-interop', () => ({
  takeUntilDestroyed:
    () =>
    <T>(source: Observable<T>) =>
      source,
}));

import { ShoppingService } from './shopping.service';
import { ShoppingList } from './shopping';

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

interface MockShoppingRepository {
  lists$: Observable<ShoppingList[]>;
  load(): void;
  unload(): void;
  create(list: ShoppingList): Promise<void>;
  update(list: ShoppingList): Promise<void>;
  delete(id: string): Promise<void>;
}

function createMockRepository(initialLists: ShoppingList[] = []): MockShoppingRepository {
  const subject = new BehaviorSubject<ShoppingList[]>(initialLists);

  return {
    lists$: subject.asObservable(),
    load(): void {
      subject.next([...subject.value]);
    },
    unload(): void {
      subject.next([]);
    },
    create(list: ShoppingList): Promise<void> {
      subject.next([...subject.value, list]);
      return Promise.resolve();
    },
    update(list: ShoppingList): Promise<void> {
      const next = subject.value.map((l) => (l.id === list.id ? list : l));
      subject.next(next);
      return Promise.resolve();
    },
    delete(id: string): Promise<void> {
      const next = subject.value.filter((l) => l.id !== id);
      subject.next(next);
      return Promise.resolve();
    },
  };
}

function makeService(repo?: MockShoppingRepository) {
  const r = repo ?? createMockRepository();
  const destroyRef = createFakeDestroyRef();
  const service = new ShoppingService(r as any, destroyRef);
  return { service, repo: r, destroyRef };
}

describe('ShoppingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with empty lists', () => {
    const { service } = makeService();

    expect(service.lists()).toEqual([]);
    expect(service.listCount()).toBe(0);
    expect(service.loading()).toBe(false);
  });

  it('syncs lists from repository', async () => {
    const repo = createMockRepository([
      {
        id: 'list-1',
        name: 'Groceries',
        items: [],
        createdAt: new Date().toISOString(),
      },
    ]);

    const { service } = makeService(repo);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.lists().length).toBe(1);
    expect(service.lists()[0].name).toBe('Groceries');
    expect(service.listCount()).toBe(1);
  });

  it('createListWithId() adds new list', async () => {
    const { service } = makeService();

    await service.createListWithId('new-id', 'My List');

    const lists = service.lists();
    expect(lists.length).toBe(1);
    expect(lists[0].id).toBe('new-id');
    expect(lists[0].name).toBe('My List');
    expect(lists[0].items).toEqual([]);
  });

  it('deleteList() removes list', async () => {
    const repo = createMockRepository([
      { id: '1', name: 'A', items: [], createdAt: '' },
      { id: '2', name: 'B', items: [], createdAt: '' },
    ]);

    const { service } = makeService(repo);

    await service.deleteList('1');

    expect(service.getListById('1')).toBeUndefined();
    expect(service.lists().length).toBe(1);
  });

  it('addItem() appends item to list', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'item-id' } as any);

    const repo = createMockRepository([
      { id: 'list-1', name: 'Groceries', items: [], createdAt: '' },
    ]);

    const { service } = makeService(repo);

    await service.addItem('list-1', 'Milk', '2L');

    const list = service.getListById('list-1')!;
    expect(list.items.length).toBe(1);
    expect(list.items[0].name).toBe('Milk');
    expect(list.items[0].quantity).toBe('2L');
    expect(list.items[0].done).toBe(false);
  });

  it('addItem() without quantity does not set quantity field', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'item-id' } as any);

    const repo = createMockRepository([
      { id: 'list-1', name: 'Groceries', items: [], createdAt: '' },
    ]);

    const { service } = makeService(repo);

    await service.addItem('list-1', 'Bread');

    const list = service.getListById('list-1')!;
    expect(list.items[0].quantity).toBeUndefined();
  });

  it('toggleItem() flips done status', async () => {
    const repo = createMockRepository([
      {
        id: 'list-1',
        name: 'Groceries',
        items: [{ id: 'item-1', name: 'Milk', done: false }],
        createdAt: '',
      },
    ]);

    const { service } = makeService(repo);

    await service.toggleItem('list-1', 'item-1');
    expect(service.getListById('list-1')!.items[0].done).toBe(true);

    await service.toggleItem('list-1', 'item-1');
    expect(service.getListById('list-1')!.items[0].done).toBe(false);
  });

  it('removeItem() deletes item from list', async () => {
    const repo = createMockRepository([
      {
        id: 'list-1',
        name: 'Groceries',
        items: [
          { id: 'item-1', name: 'Milk', done: false },
          { id: 'item-2', name: 'Bread', done: false },
        ],
        createdAt: '',
      },
    ]);

    const { service } = makeService(repo);

    await service.removeItem('list-1', 'item-1');

    const list = service.getListById('list-1')!;
    expect(list.items.length).toBe(1);
    expect(list.items[0].name).toBe('Bread');
  });

  it('updateItemName() changes item name', async () => {
    const repo = createMockRepository([
      {
        id: 'list-1',
        name: 'Groceries',
        items: [{ id: 'item-1', name: 'Milk', done: false }],
        createdAt: '',
      },
    ]);

    const { service } = makeService(repo);

    await service.updateItemName('list-1', 'item-1', 'Oat Milk');

    expect(service.getListById('list-1')!.items[0].name).toBe('Oat Milk');
  });

  it('updateItemName() with empty name does nothing', async () => {
    const repo = createMockRepository([
      {
        id: 'list-1',
        name: 'Groceries',
        items: [{ id: 'item-1', name: 'Milk', done: false }],
        createdAt: '',
      },
    ]);

    const { service } = makeService(repo);

    await service.updateItemName('list-1', 'item-1', '   ');

    expect(service.getListById('list-1')!.items[0].name).toBe('Milk');
  });

  it('updateItemQuantity() changes item quantity', async () => {
    const repo = createMockRepository([
      {
        id: 'list-1',
        name: 'Groceries',
        items: [{ id: 'item-1', name: 'Milk', done: false, quantity: '1L' }],
        createdAt: '',
      },
    ]);

    const { service } = makeService(repo);

    await service.updateItemQuantity('list-1', 'item-1', '2L');

    expect(service.getListById('list-1')!.items[0].quantity).toBe('2L');
  });

  it('updateItemQuantity() with empty string removes quantity', async () => {
    const repo = createMockRepository([
      {
        id: 'list-1',
        name: 'Groceries',
        items: [{ id: 'item-1', name: 'Milk', done: false, quantity: '1L' }],
        createdAt: '',
      },
    ]);

    const { service } = makeService(repo);

    await service.updateItemQuantity('list-1', 'item-1', '');

    expect(service.getListById('list-1')!.items[0].quantity).toBeUndefined();
  });

  it('getListById() returns correct list or undefined', async () => {
    const repo = createMockRepository([
      { id: '1', name: 'A', items: [], createdAt: '' },
      { id: '2', name: 'B', items: [], createdAt: '' },
    ]);

    const { service } = makeService(repo);

    expect(service.getListById('1')?.name).toBe('A');
    expect(service.getListById('2')?.name).toBe('B');
    expect(service.getListById('999')).toBeUndefined();
  });

  it('sets loading flag during operations', async () => {
    const repo = createMockRepository();
    const originalCreate = repo.create.bind(repo);
    let resolveCreate!: () => void;
    repo.create = vi.fn(() => new Promise<void>((resolve) => (resolveCreate = resolve)));

    const { service } = makeService(repo);

    const promise = service.createListWithId('id', 'Name');

    expect(service.loading()).toBe(true);

    resolveCreate();
    await promise;

    expect(service.loading()).toBe(false);

    repo.create = originalCreate;
  });

  it('handles operations on non-existent list gracefully', async () => {
    const { service } = makeService();

    // Should not throw
    await service.addItem('non-existent', 'Milk');
    await service.toggleItem('non-existent', 'item-1');
    await service.removeItem('non-existent', 'item-1');
    await service.updateItemName('non-existent', 'item-1', 'New');
    await service.updateItemQuantity('non-existent', 'item-1', '2L');

    expect(service.lists()).toEqual([]);
  });
});
