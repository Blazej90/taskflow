import { Injectable, signal } from '@angular/core';
import { firebaseApp } from '@/firebase.config';

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  User,
} from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth(firebaseApp);

  user = signal<User | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.auth.onAuthStateChanged((user) => {
      this.user.set(user);
    });
  }

  async loginWithGoogle() {
    try {
      this.loading.set(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async sendMagicLink(email: string) {
    try {
      this.loading.set(true);

      const actionCodeSettings = {
        url: window.location.origin + '/auth',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      localStorage.setItem('emailForSignIn', email);
    } catch (err: any) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async completeMagicLinkLogin() {
    if (!isSignInWithEmailLink(this.auth, window.location.href)) return;

    let email = localStorage.getItem('emailForSignIn');
    if (!email) email = window.prompt('Podaj email do logowania') ?? '';

    await signInWithEmailLink(this.auth, email, window.location.href);
    localStorage.removeItem('emailForSignIn');
  }

  async logout() {
    await signOut(this.auth);
  }
}
