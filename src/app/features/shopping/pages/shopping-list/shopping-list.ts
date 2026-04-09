import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShoppingService } from '../../shopping.service';
import { ShoppingList } from '../../shopping';
import { ConfirmService } from '@/shared/ui/confirm-dialog/confirm.service';
import { ToastService } from '@/shared/ui/toast/toast.service';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.scss',
})
export class ShoppingListPage implements OnInit, OnDestroy {
  protected shoppingService = inject(ShoppingService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

  expandedList = signal<string | null>(null);
  showCreateDialog = signal(false);
  newListName = signal('');
  newItemName = signal('');
  newItemQuantity = signal('');
  showQuantity = signal(false);

  // Item editing state
  editingItemId = signal<string | null>(null);
  editItemName = signal('');
  editingQuantityId = signal<string | null>(null);
  editQuantity = signal('');

  ngOnInit(): void {
    this.shoppingService.load();
  }

  ngOnDestroy(): void {
    this.shoppingService.unload();
  }

  toggleExpand(listId: string): void {
    this.expandedList.update((current) => (current === listId ? null : listId));
    // Clear inputs when switching lists
    this.newItemName.set('');
    this.newItemQuantity.set('');
    this.showQuantity.set(false);
  }

  toggleQuantity(): void {
    this.showQuantity.update((v) => !v);
    if (!this.showQuantity()) {
      this.newItemQuantity.set('');
    }
  }

  async createList(): Promise<void> {
    const name = this.newListName().trim();
    if (!name) return;

    try {
      const newListId = crypto.randomUUID();
      await this.shoppingService.createListWithId(newListId, name);
      this.newListName.set('');
      this.showCreateDialog.set(false);
      this.expandedList.set(newListId); // Auto-expand new list
      this.toast.success('Shopping list created');
    } catch {
      this.toast.error('Failed to create list');
    }
  }

  async deleteList(id: string): Promise<void> {
    const confirmed = await this.confirm.open({
      title: 'Delete list',
      message: 'Are you sure you want to delete this shopping list?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await this.shoppingService.deleteList(id);
      if (this.expandedList() === id) {
        this.expandedList.set(null);
      }
      this.toast.success('List deleted');
    } catch {
      this.toast.error('Failed to delete list');
    }
  }

  startEdit(list: ShoppingList): void {
    // For simplicity, just expand the list. Edit could be added later.
    this.toggleExpand(list.id);
  }

  startEditItem(itemId: string, currentName: string): void {
    this.editingItemId.set(itemId);
    this.editItemName.set(currentName);
  }

  async saveItemName(listId: string, itemId: string): Promise<void> {
    const newName = this.editItemName().trim();
    if (!newName) {
      this.cancelEditItem();
      return;
    }

    try {
      await this.shoppingService.updateItemName(listId, itemId, newName);
      this.cancelEditItem();
    } catch {
      this.toast.error('Failed to update item');
    }
  }

  cancelEditItem(): void {
    this.editingItemId.set(null);
    this.editItemName.set('');
  }

  startEditQuantity(itemId: string, currentQuantity: string | undefined): void {
    this.editingQuantityId.set(itemId);
    this.editQuantity.set(currentQuantity ?? '');
  }

  async saveItemQuantity(listId: string, itemId: string): Promise<void> {
    const newQuantity = this.editQuantity().trim();

    try {
      // If empty, remove quantity; otherwise update it
      if (newQuantity === '') {
        await this.shoppingService.updateItemQuantity(listId, itemId, '');
      } else {
        await this.shoppingService.updateItemQuantity(listId, itemId, newQuantity);
      }
      this.cancelEditQuantity();
    } catch {
      this.toast.error('Failed to update quantity');
    }
  }

  cancelEditQuantity(): void {
    this.editingQuantityId.set(null);
    this.editQuantity.set('');
  }

  async addItem(listId: string): Promise<void> {
    const name = this.newItemName().trim();
    if (!name) return;

    try {
      await this.shoppingService.addItem(listId, name, this.newItemQuantity() || undefined);
      this.newItemName.set('');
      this.newItemQuantity.set('');
    } catch {
      this.toast.error('Failed to add item');
    }
  }

  async toggleItem(listId: string, itemId: string): Promise<void> {
    try {
      await this.shoppingService.toggleItem(listId, itemId);
    } catch {
      this.toast.error('Failed to update item');
    }
  }

  async removeItem(listId: string, itemId: string): Promise<void> {
    try {
      await this.shoppingService.removeItem(listId, itemId);
    } catch {
      this.toast.error('Failed to remove item');
    }
  }

  getDoneCount(list: ShoppingList): number {
    return list.items.filter((i) => i.done).length;
  }
}
