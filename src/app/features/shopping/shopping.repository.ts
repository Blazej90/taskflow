import { Injectable, inject } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  FieldValue,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  Unsubscribe,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

import { db } from '@/firestore.client';
import { AuthService } from '@/features/auth/auth.service';
import type { ShoppingList } from './shopping';

@Injectable({ providedIn: 'root' })
export class ShoppingRepository {
  private readonly auth = inject(AuthService);

  private listsSubject = new BehaviorSubject<ShoppingList[]>([]);
  lists$: Observable<ShoppingList[]> = this.listsSubject.asObservable();

  private unsubscribe?: Unsubscribe;

  load(): void {
    const user = this.auth.user();

    if (!user) {
      this.listsSubject.next([]);
      return;
    }

    this.unload();

    const q = query(
      collection(db, 'shopping-lists'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(50),
    );

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lists = snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name ?? 'Shopping List',
            items: data.items ?? [],
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
          } satisfies ShoppingList;
        });

        this.listsSubject.next(lists);
      },
      (error) => {
        console.error('Failed to load shopping lists:', error.message, error.code);
        this.listsSubject.next([]);
      },
    );
  }

  unload(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.listsSubject.next([]);
  }

  async create(list: ShoppingList): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const ref = doc(collection(db, 'shopping-lists'), list.id);

    await setDoc(ref, {
      userId: user.uid,
      name: list.name,
      items: list.items,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async update(list: ShoppingList): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const ref = doc(collection(db, 'shopping-lists'), list.id);

    await updateDoc(ref, {
      name: list.name,
      items: list.items,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const ref = doc(collection(db, 'shopping-lists'), id);
    await deleteDoc(ref);
  }
}
