import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyBhDlT0B2hZzFFvxu6jDHPT_k3llHJxbyY',
  authDomain: 'task-flow-blazej.firebaseapp.com',
  projectId: 'task-flow-blazej',
  storageBucket: 'task-flow-blazej.firebasestorage.app',
  messagingSenderId: '157599488491',
  appId: '1:157599488491:web:e4081e3c8d9b18d31c21ae',
  measurementId: 'G-DMXTKEBRMR',
};

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
