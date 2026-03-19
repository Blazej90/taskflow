import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { ShoppingService } from './shopping.service';
import { ShoppingList, ShoppingItem } from './shopping';

interface ShoppingRepositoryMock {
  lists$: BehaviorSubject<ShoppingList[]>;
  load: () => void;
  unload: () => void;
  create: (list: ShoppingList) => Promise<void>;
  update: (list: ShoppingList) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

function createInMemoryRepository(): ShoppingRepositoryMock {
  const store: ShoppingList[] | null = null;
  const subject = new BehaviorSubject<ShoppingList[]>([]);
  
  return {
    lists$: subject,
    load: () => subject.next(store ?? []),
    unload: () => {},
    create: async (list: ShoppingList) => {
      const current = subject.getValue();
      subject.next([...current, list]);
    },
    update: async (list: ShoppingList) => {
      const current = subject.getValue();
      subject.next(current.map((l) => (l.id === list.id ? list : l)));
    },
    delete: async (id: string) => {
      const current = subject.getValue();
      subject.next(current.filter((l) => l.id !== id));
    },
  };
}

describe('ShoppingService', () => {
  let service: ShoppingService;
  let repository: ShoppingRepositoryMock;

  beforeEach(() => {
    repository = createInMemoryRepository();
    service = new ShoppingService();
    // Replace the injected repository with our test double
    (service as any).repository = repository;
    // Subscribe to repository lists$ to update service lists signal
    repository.lists$.subscribe((lists) => {
      (service as any).lists.set(lists);
    });
  });

  describe('list management', () => {
    it('should create a new list', async () => {
      await service.createListWithId('list-1', 'Groceries');
      
      expect(service.listCount()).toBe(1);
      expect(service.lists()[0].name).toBe('Groceries');
      expect(service.lists()[0].items).toEqual([]);
    });

    it('should delete a list', async () => {
      await service.createListWithId('list-1', 'Groceries');
      await service.deleteList('list-1');
      
      expect(service.listCount()).toBe(0);
    });

    it('should track loading state during operations', async () => {
      expect(service.loading()).toBe(false);
      
      const promise = service.createListWithId('list-1', 'Test');
      expect(service.loading()).toBe(true);
      
      await promise;
      expect(service.loading()).toBe(false);
    });
  });

  describe('item management', () => {
    beforeEach(async () => {
      await service.createListWithId('list-1', 'Groceries');
    });

    it('should add item to list', async () => {
      await service.addItem('list-1', 'Milk', '2L');
      
      const list = service.lists()[0];
      expect(list.items.length).toBe(1);
      expect(list.items[0].name).toBe('Milk');
      expect(list.items[0].quantity).toBe('2L');
      expect(list.items[0].done).toBe(false);
    });

    it('should add item without quantity', async () => {
      await service.addItem('list-1', 'Bread', undefined);
      
      const list = service.lists()[0];
      expect(list.items.length).toBe(1);
      expect(list.items[0].name).toBe('Bread');
      expect(list.items[0].quantity).toBeUndefined();
    });

    it('should toggle item done status', async () => {
      await service.addItem('list-1', 'Milk', '2L');
      const itemId = service.lists()[0].items[0].id;
      
      await service.toggleItem('list-1', itemId);
      
      const item = service.lists()[0].items[0];
      expect(item.done).toBe(true);
    });

    it('should remove item from list', async () => {
      await service.addItem('list-1', 'Milk', '2L');
      const itemId = service.lists()[0].items[0].id;
      
      await service.removeItem('list-1', itemId);
      
      expect(service.lists()[0].items.length).toBe(0);
    });

    it('should add multiple items to list', async () => {
      await service.addItem('list-1', 'Milk', '2L');
      await service.addItem('list-1', 'Bread', '1 loaf');
      await service.addItem('list-1', 'Eggs', '12');
      
      const list = service.lists()[0];
      expect(list.items.length).toBe(3);
    });
  });

  describe('computed values', () => {
    it('should calculate done count', async () => {
      await service.createListWithId('list-1', 'Test');
      await service.addItem('list-1', 'Item 1', undefined);
      await service.addItem('list-1', 'Item 2', undefined);
      
      const itemId = service.lists()[0].items[0].id;
      await service.toggleItem('list-1', itemId);
      
      const doneCount = service.lists()[0].items.filter(i => i.done).length;
      expect(doneCount).toBe(1);
    });
  });
});
