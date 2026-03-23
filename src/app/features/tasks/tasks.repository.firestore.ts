import { Injectable, inject } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  FieldValue,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

import { db } from '@/firestore.client';
import { AuthService } from '@/features/auth/auth.service';
import type { Priority, Task, TaskStatus } from './task';
import type { TasksRepository } from './task.repository';

type TaskDoc = {
  userId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  order: number;
  dueDate?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
};

@Injectable({ providedIn: 'root' })
export class FirestoreTasksRepository implements TasksRepository {
  private readonly auth = inject(AuthService);

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  private unsubscribe?: Unsubscribe;

  load(): void {
    const user = this.auth.user();

    if (!user) {
      this.tasksSubject.next([]);
      return;
    }

    this.unload();

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('order', 'asc'),
    );

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks = snapshot.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as TaskDoc;
          return {
            id: d.id,
            title: data.title,
            description: data.description ?? '',
            status: data.status,
            priority: data.priority ?? 'medium',
            order: data.order,
            dueDate: data.dueDate,
          } satisfies Task;
        });

        this.tasksSubject.next(tasks);
      },
      (error) => {
        console.error('Failed to load tasks:', error.message, error.code);
        this.tasksSubject.next([]);
      },
    );
  }

  unload(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.tasksSubject.next([]);
  }

  async save(tasks: Task[]): Promise<void> {
    const user = this.auth.user();

    if (!user) {
      console.warn('Cannot save: no user authenticated');
      return;
    }

    await this.saveToFirestore(user.uid, tasks);
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
      priority: task.priority,
      order: typeof task.order === 'number' ? task.order : Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add dueDate if it's defined (Firestore doesn't accept undefined)
    if (task.dueDate) {
      payload.dueDate = task.dueDate;
    }

    await setDoc(ref, payload);
  }

  async update(task: Task): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const ref = doc(collection(db, 'tasks'), task.id);

    const patch: Partial<TaskDoc> & { updatedAt: FieldValue } = {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      updatedAt: serverTimestamp(),
    };

    if (typeof task.order === 'number') {
      patch.order = task.order;
    }

    if (task.dueDate) {
      patch.dueDate = task.dueDate;
    }

    await updateDoc(ref, patch);
  }

  async delete(id: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const ref = doc(collection(db, 'tasks'), id);
    await deleteDoc(ref);
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
  }

  private async saveToFirestore(uid: string, tasks: Task[]) {
    const q = query(collection(db, 'tasks'), where('userId', '==', uid));
    const snap = await getDocs(q);

    const existingIds = new Set(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.id));
    const newIds = new Set(tasks.map((t) => t.id));

    const batch = writeBatch(db);

    snap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
      if (!newIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    for (const task of tasks) {
      const ref = doc(collection(db, 'tasks'), task.id);

      if (existingIds.has(task.id)) {
        const patch: Partial<TaskDoc> & { updatedAt: FieldValue } = {
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          order: typeof task.order === 'number' ? task.order : 0,
          updatedAt: serverTimestamp(),
        };
        if (task.dueDate) {
          patch.dueDate = task.dueDate;
        }
        batch.update(ref, patch);
      } else {
        const payload: TaskDoc = {
          userId: uid,
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          order: typeof task.order === 'number' ? task.order : Date.now(),
          dueDate: task.dueDate,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        batch.set(ref, payload);
      }
    }

    await batch.commit();
  }
}
