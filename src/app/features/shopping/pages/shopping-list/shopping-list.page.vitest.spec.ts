import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ShoppingListPage } from './shopping-list';
import { ShoppingService } from '../../shopping.service';
import { ConfirmService } from '@/shared/ui/confirm-dialog/confirm.service';
import { ToastService } from '@/shared/ui/toast/toast.service';
import { ShoppingList } from '../../shopping';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('ShoppingListPage', () => {
  let component: ShoppingListPage;
  let fixture: ComponentFixture<ShoppingListPage>;
  let mockShoppingService: any;
  let mockConfirmService: any;
  let mockToastService: any;

  const mockLists: ShoppingList[] = [
    {
      id: 'list-1',
      name: 'Groceries',
      items: [
        { id: 'item-1', name: 'Milk', done: false, quantity: '2L' },
        { id: 'item-2', name: 'Bread', done: true },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'list-2',
      name: 'Hardware',
      items: [],
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    mockShoppingService = {
      lists: signal(mockLists),
      listCount: signal(2),
      loading: signal(false),
      load: vi.fn(),
      unload: vi.fn(),
      createListWithId: vi.fn().mockResolvedValue(undefined),
      deleteList: vi.fn().mockResolvedValue(undefined),
      addItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
      toggleItem: vi.fn().mockResolvedValue(undefined),
    };

    mockConfirmService = {
      open: vi.fn().mockResolvedValue(true),
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ShoppingListPage, FormsModule],
      providers: [
        { provide: ShoppingService, useValue: mockShoppingService },
        { provide: ConfirmService, useValue: mockConfirmService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingListPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load lists on init', () => {
    component.ngOnInit();
    expect(mockShoppingService.load).toHaveBeenCalled();
  });

  it('should unload on destroy', () => {
    component.ngOnDestroy();
    expect(mockShoppingService.unload).toHaveBeenCalled();
  });

  it('should calculate done count correctly', () => {
    const list = mockLists[0];
    const doneCount = component.getDoneCount(list);
    expect(doneCount).toBe(1); // Only Bread is done
  });

  it('should toggle list expansion', () => {
    component.toggleExpand('list-1');
    expect(component.expandedList()).toBe('list-1');

    // Toggle again should collapse
    component.toggleExpand('list-1');
    expect(component.expandedList()).toBeNull();
  });

  it('should clear inputs when switching lists', () => {
    component.newItemName.set('Test Item');
    component.newItemQuantity.set('2');
    component.showQuantity.set(true);

    component.toggleExpand('list-1');

    expect(component.newItemName()).toBe('');
    expect(component.newItemQuantity()).toBe('');
    expect(component.showQuantity()).toBe(false);
  });

  it('should add item with quantity', async () => {
    component.expandedList.set('list-1');
    component.newItemName.set('Eggs');
    component.newItemQuantity.set('12');

    await component.addItem('list-1');

    expect(mockShoppingService.addItem).toHaveBeenCalledWith('list-1', 'Eggs', '12');
    expect(component.newItemName()).toBe('');
    expect(component.newItemQuantity()).toBe('');
  });

  it('should add item without quantity', async () => {
    component.expandedList.set('list-1');
    component.newItemName.set('Salt');
    component.showQuantity.set(false);

    await component.addItem('list-1');

    expect(mockShoppingService.addItem).toHaveBeenCalledWith('list-1', 'Salt', undefined);
  });

  it('should not add empty item', async () => {
    component.expandedList.set('list-1');
    component.newItemName.set('   ');

    await component.addItem('list-1');

    expect(mockShoppingService.addItem).not.toHaveBeenCalled();
  });

  it('should toggle quantity visibility', () => {
    expect(component.showQuantity()).toBe(false);

    component.toggleQuantity();
    expect(component.showQuantity()).toBe(true);

    component.toggleQuantity();
    expect(component.showQuantity()).toBe(false);
  });

  it('should clear quantity when hiding quantity field', () => {
    component.newItemQuantity.set('5');
    component.showQuantity.set(true);

    component.toggleQuantity();

    expect(component.showQuantity()).toBe(false);
    expect(component.newItemQuantity()).toBe('');
  });

  it('should create new list', async () => {
    component.newListName.set('New Shopping List');
    component.showCreateDialog.set(true);

    await component.createList();

    expect(mockShoppingService.createListWithId).toHaveBeenCalled();
    expect(component.newListName()).toBe('');
    expect(component.showCreateDialog()).toBe(false);
    expect(mockToastService.success).toHaveBeenCalledWith('Shopping list created');
  });

  it('should not create list with empty name', async () => {
    component.newListName.set('   ');

    await component.createList();

    expect(mockShoppingService.createListWithId).not.toHaveBeenCalled();
  });

  it('should delete list after confirmation', async () => {
    await component.deleteList('list-1');

    expect(mockConfirmService.open).toHaveBeenCalled();
    expect(mockShoppingService.deleteList).toHaveBeenCalledWith('list-1');
    expect(mockToastService.success).toHaveBeenCalledWith('List deleted');
  });

  it('should not delete list if cancelled', async () => {
    mockConfirmService.open.mockResolvedValue(false);

    await component.deleteList('list-1');

    expect(mockConfirmService.open).toHaveBeenCalled();
    expect(mockShoppingService.deleteList).not.toHaveBeenCalled();
  });

  it('should remove item', async () => {
    await component.removeItem('list-1', 'item-1');

    expect(mockShoppingService.removeItem).toHaveBeenCalledWith('list-1', 'item-1');
  });

  it('should toggle item', async () => {
    await component.toggleItem('list-1', 'item-1');

    expect(mockShoppingService.toggleItem).toHaveBeenCalledWith('list-1', 'item-1');
  });
});
