import { Injectable, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ShoppingList, ShoppingItem } from './shopping';
import { ShoppingRepository } from './shopping.repository';

@Injectable({ providedIn: 'root' })
export class ShoppingService {
  readonly lists = signal<ShoppingList[]>([]);
  readonly loading = signal(false);

  readonly listCount = computed(() => this.lists().length);

  constructor(
    private repository: ShoppingRepository,
    private destroyRef: DestroyRef,
  ) {
    this.repository.lists$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (lists) => this.lists.set(lists),
      error: (err) => {
        console.error('Failed to load shopping lists:', err);
        this.lists.set([]);
      },
    });
  }

  load(): void {
    this.repository.load();
  }

  unload(): void {
    this.repository.unload();
  }

  async createList(name: string): Promise<void> {
    await this.createListWithId(crypto.randomUUID(), name);
  }

  async createListWithId(id: string, name: string): Promise<void> {
    this.loading.set(true);
    try {
      const newList: ShoppingList = {
        id,
        name,
        items: [],
        createdAt: new Date().toISOString(),
      };
      await this.repository.create(newList);
    } finally {
      this.loading.set(false);
    }
  }

  async updateList(list: ShoppingList): Promise<void> {
    this.loading.set(true);
    try {
      await this.repository.update(list);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteList(id: string): Promise<void> {
    this.loading.set(true);
    try {
      await this.repository.delete(id);
    } finally {
      this.loading.set(false);
    }
  }

  async addItem(listId: string, itemName: string, quantity?: string): Promise<void> {
    const list = this.lists().find((l) => l.id === listId);
    if (!list) return;

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: itemName,
      done: false,
    };

    if (quantity?.trim()) {
      newItem.quantity = quantity.trim();
    }

    const updatedList = {
      ...list,
      items: [...list.items, newItem],
    };

    await this.updateList(updatedList);
  }

  async toggleItem(listId: string, itemId: string): Promise<void> {
    const list = this.lists().find((l) => l.id === listId);
    if (!list) return;

    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );

    await this.updateList({ ...list, items: updatedItems });
  }

  async removeItem(listId: string, itemId: string): Promise<void> {
    const list = this.lists().find((l) => l.id === listId);
    if (!list) return;

    const updatedItems = list.items.filter((item) => item.id !== itemId);

    await this.updateList({ ...list, items: updatedItems });
  }

  async updateItemName(listId: string, itemId: string, newName: string): Promise<void> {
    const list = this.lists().find((l) => l.id === listId);
    if (!list) return;

    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, name: trimmedName } : item,
    );

    await this.updateList({ ...list, items: updatedItems });
  }

  async updateItemQuantity(listId: string, itemId: string, newQuantity: string): Promise<void> {
    const list = this.lists().find((l) => l.id === listId);
    if (!list) return;

    const trimmedQuantity = newQuantity.trim();
    
    const updatedItems = list.items.map((item) =>
      item.id === itemId 
        ? { ...item, quantity: trimmedQuantity || undefined } 
        : item,
    );

    await this.updateList({ ...list, items: updatedItems });
  }

  getListById(id: string): ShoppingList | undefined {
    return this.lists().find((l) => l.id === id);
  }
}
