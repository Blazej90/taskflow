import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { firebaseApp } from './firebase.config';

export const db: Firestore = getFirestore(firebaseApp);
