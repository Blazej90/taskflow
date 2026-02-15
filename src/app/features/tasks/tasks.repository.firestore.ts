import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
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
  createdAt?: any;
  updatedAt?: any;
};

@Injectable({ providedIn: 'root' })
export class FirestoreTasksRepository implements TasksRepository {
  private readonly auth = inject(AuthService);
  constructor() {
    console.log('🔥 FirestoreTasksRepository ACTIVE');
  }

  private cache: Task[] | null = null;

  load(): Task[] | null {
    const user = this.auth.user();

    if (!user) {
      this.cache = [];
      return this.cache;
    }

    if (this.cache) return this.cache;

    this.fetchFromFirestore(user.uid);

    return null;
  }

  save(tasks: Task[]): void {
    console.log('💾 save() called, tasks count:', tasks.length);
    const user = this.auth.user();

    this.cache = tasks;

    if (!user) return;

    this.saveToFirestore(user.uid, tasks);
  }

  private async fetchFromFirestore(uid: string) {
    const q = query(collection(db, 'tasks'), where('userId', '==', uid));
    const snap = await getDocs(q);

    this.cache = snap.docs.map((d) => {
      const data = d.data() as TaskDoc;
      return {
        id: d.id,
        title: data.title,
        description: data.description ?? '',
        status: data.status,
      } satisfies Task;
    });
  }

  private async saveToFirestore(uid: string, tasks: Task[]) {
    const q = query(collection(db, 'tasks'), where('userId', '==', uid));
    const snap = await getDocs(q);

    const batch = writeBatch(db);

    snap.docs.forEach((d) => batch.delete(d.ref));

    tasks.forEach((t) => {
      const ref = doc(collection(db, 'tasks'), t.id);
      const payload: TaskDoc = {
        userId: uid,
        title: t.title,
        description: t.description ?? '',
        status: t.status,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };
      batch.set(ref, payload, { merge: true });
    });

    try {
      await batch.commit();
      console.log('✅ Firestore batch committed');
    } catch (e) {
      console.error('❌ Firestore batch FAILED', e);
    }
  }
}
