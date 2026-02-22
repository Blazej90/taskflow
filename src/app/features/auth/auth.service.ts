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

  magicLinkSent = signal(false);
  magicLinkEmail = signal<string | null>(null);

  constructor() {
    this.auth.onAuthStateChanged((user) => {
      this.user.set(user);
    });
  }

  private toUserMessage(err: any): string {
    const code = (err?.code || '').toString();

    switch (code) {
      case 'auth/invalid-email':
        return 'Nieprawidłowy adres email.';
      case 'auth/missing-email':
        return 'Podaj adres email.';
      case 'auth/operation-not-allowed':
        return 'Ta metoda logowania jest wyłączona w konfiguracji Firebase.';
      case 'auth/too-many-requests':
        return 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.';

      case 'auth/unauthorized-continue-uri':
        return 'Nieautoryzowany adres przekierowania. Sprawdź domeny w Firebase → Authentication → Settings → Authorized domains.';
      case 'auth/invalid-continue-uri':
        return 'Nieprawidłowy adres przekierowania dla linku. Sprawdź konfigurację URL w aplikacji i domeny w Firebase.';
      case 'auth/invalid-action-code':
        return 'Ten link do logowania jest nieprawidłowy lub wygasł. Wyślij link ponownie.';
      case 'auth/expired-action-code':
        return 'Ten link do logowania wygasł. Wyślij link ponownie.';
      case 'auth/user-disabled':
        return 'To konto zostało zablokowane.';

      case 'auth/popup-closed-by-user':
        return 'Okno logowania zostało zamknięte. Spróbuj ponownie.';
      case 'auth/cancelled-popup-request':
        return 'Logowanie zostało przerwane. Spróbuj ponownie.';
      case 'auth/popup-blocked':
        return 'Przeglądarka zablokowała okno logowania. Zezwól na popupy i spróbuj ponownie.';
      case 'auth/unauthorized-domain':
        return 'Ta domena nie jest autoryzowana do logowania Google. Dodaj ją w Firebase → Authentication → Settings → Authorized domains.';

      default: {
        const msg = (err?.message || '').toString();
        if (msg.includes('auth/')) return msg;
        return 'Wystąpił błąd logowania. Spróbuj ponownie.';
      }
    }
  }

  async loginWithGoogle() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
    } catch (err: any) {
      this.error.set(this.toUserMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async sendMagicLink(email: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      const actionCodeSettings = {
        url: window.location.origin + '/auth',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      localStorage.setItem('emailForSignIn', email);

      this.magicLinkSent.set(true);
      this.magicLinkEmail.set(email);
    } catch (err: any) {
      this.error.set(this.toUserMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async completeMagicLinkLogin() {
    if (!isSignInWithEmailLink(this.auth, window.location.href)) return;

    try {
      this.loading.set(true);
      this.error.set(null);

      let email = localStorage.getItem('emailForSignIn');
      if (!email) email = window.prompt('Podaj email do logowania') ?? '';

      if (!email.trim()) {
        this.error.set('Nie podano adresu email.');
        return;
      }

      await signInWithEmailLink(this.auth, email, window.location.href);
      localStorage.removeItem('emailForSignIn');

      this.magicLinkSent.set(false);
      this.magicLinkEmail.set(null);
    } catch (err: any) {
      this.error.set(this.toUserMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  resetMagicLinkState() {
    this.magicLinkSent.set(false);
    this.magicLinkEmail.set(null);
  }

  async logout() {
    await signOut(this.auth);
  }
}
