// import { initializeApp } from 'firebase/app';
// import type { FirebaseApp } from 'firebase/app';
// import { environment } from '@/../environments/environment';

// export const firebaseApp: FirebaseApp = initializeApp(environment.firebase);

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';

function getFirebaseConfig() {
  const cfg = (window as any).__FIREBASE_CONFIG__;

  console.log('WINDOW CONFIG AT INIT:', cfg);

  if (!cfg?.apiKey) {
    throw new Error('Brak Firebase config. Sprawdź czy /firebase-config.js się ładuje.');
  }

  return cfg;
}

export const firebaseApp: FirebaseApp = initializeApp(getFirebaseConfig());
