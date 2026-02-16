import { Injectable, inject } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firestore.client';
import { AuthService } from '@/features/auth/auth.service';
import type { Task, TaskStatus } from './task';
import type { TasksRepository } from './task.repository';

type TaskDoc = {
  userId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  order: number;
  createdAt?: any;
  updatedAt?: any;
};

@Injectable({ providedIn: 'root' })
export class FirestoreTasksRepository implements TasksRepository {
  private readonly auth = inject(AuthService);

  private cache: Task[] | null = null;

  load(): Task[] | null {
    const user = this.auth.user();

    if (!user) {
      this.cache = [];
      return this.cache;
    }

    if (this.cache) return this.cache;

    void this.fetchFromFirestore(user.uid);
    return null;
  }

  async save(tasks: Task[]): Promise<void> {
    const user = this.auth.user();
    this.cache = tasks;

    if (!user) {
      console.warn('Cannot save: no user');
      return;
    }

    try {
      await this.saveToFirestore(user.uid, tasks);
      console.log('✅ Saved successfully');
    } catch (error) {
      console.error('❌ Save failed:', error);
      throw error;
    }
  }

  async create(task: Task): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const ref = doc(collection(db, 'tasks'), task.id);

    const payload: TaskDoc = {
      userId: user.uid,
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      order: typeof task.order === 'number' ? task.order : Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload);

    if (this.cache) this.cache = [...this.cache, { ...task, order: payload.order }];
  }

  async update(task: Task): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const ref = doc(collection(db, 'tasks'), task.id);

    const patch: any = {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      updatedAt: serverTimestamp(),
    };

    if (typeof task.order === 'number') {
      patch.order = task.order;
    }

    await updateDoc(ref, patch);

    if (this.cache) {
      this.cache = this.cache.map((t) => (t.id === task.id ? { ...t, ...task } : t));
    }
  }

  async delete(id: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const ref = doc(collection(db, 'tasks'), id);
    await deleteDoc(ref);

    if (this.cache) this.cache = this.cache.filter((t) => t.id !== id);
  }

  async reorder(tasks: Task[]): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const batch = writeBatch(db);

    tasks.forEach((t) => {
      const ref = doc(collection(db, 'tasks'), t.id);
      batch.update(ref, {
        order: typeof t.order === 'number' ? t.order : 0,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    this.cache = tasks;
  }

  private async fetchFromFirestore(uid: string) {
    const q = query(collection(db, 'tasks'), where('userId', '==', uid), orderBy('order', 'asc'));

    const snap = await getDocs(q);

    this.cache = snap.docs.map((d) => {
      const data = d.data() as TaskDoc;

      return {
        id: d.id,
        title: data.title,
        description: data.description ?? '',
        status: data.status,
        order: data.order,
      } satisfies Task;
    });
  }

  private async saveToFirestore(uid: string, tasks: Task[]) {
    const q = query(collection(db, 'tasks'), where('userId', '==', uid));
    const snap = await getDocs(q);

    const existingIds = new Set(snap.docs.map((d) => d.id));
    const newIds = new Set(tasks.map((t) => t.id));

    const batch = writeBatch(db);

    snap.docs.forEach((d) => {
      if (!newIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    for (const task of tasks) {
      const ref = doc(collection(db, 'tasks'), task.id);

      if (existingIds.has(task.id)) {
        const patch: any = {
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          order: typeof task.order === 'number' ? task.order : 0,
          updatedAt: serverTimestamp(),
        };
        batch.update(ref, patch);
      } else {
        const payload: TaskDoc = {
          userId: uid,
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          order: typeof task.order === 'number' ? task.order : Date.now(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        batch.set(ref, payload);
      }
    }

    await batch.commit();
  }
}
