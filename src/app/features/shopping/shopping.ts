export interface ShoppingItem {
  id: string;
  name: string;
  done: boolean;
  quantity?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
  updatedAt?: string;
}
