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

/**
 * Authentication service handling user sign-in and sign-out.
 *
 * Supports two authentication methods:
 * - Google Sign-In (popup-based OAuth)
 * - Magic Link (email-based passwordless authentication)
 *
 * Uses Firebase Auth and exposes reactive signals for UI binding.
 *
 * @example
 * // Template usage
 * @if (auth.user()) {
 *   <p>Welcome {{ auth.user()?.displayName }}</p>
 *   <button (click)="auth.logout()">Logout</button>
 * } @else {
 *   <button (click)="auth.loginWithGoogle()">Login with Google</button>
 * }
 *
 * @example
 * // Component usage
 * export class MyComponent {
 *   auth = inject(AuthService);
 *
 *   async handleLogin() {
 *     await this.auth.loginWithGoogle();
 *     if (this.auth.error()) {
 *       console.error('Login failed:', this.auth.error());
 *     }
 *   }
 * }
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth(firebaseApp);

  /** Currently authenticated user, null if not logged in */
  user = signal<User | null>(null);

  /** Loading state for ongoing authentication operations */
  loading = signal(false);

  /** Error message from last failed operation, null if no error */
  error = signal<string | null>(null);

  /** Whether magic link has been sent successfully */
  magicLinkSent = signal(false);

  /** Email address used for magic link (stored for confirmation UI) */
  magicLinkEmail = signal<string | null>(null);

  constructor() {
    this.auth.onAuthStateChanged((user) => {
      this.user.set(user);
    });
  }

  /**
   * Converts Firebase error codes to user-friendly Polish messages.
   *
   * @param err - Firebase error object
   * @returns Localized error message for display in UI
   * @internal
   */
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

  /**
   * Initiates Google Sign-In using popup-based OAuth flow.
   *
   * Opens a Google authentication popup. On success, user signal is updated.
   * On failure, error signal contains localized error message.
   *
   * @returns Promise that resolves when popup closes (success or failure)
   */
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

  /**
   * Sends a magic link (passwordless sign-in link) to the provided email.
   *
   * The user will receive an email with a link. Clicking it opens the app
   * and completes authentication via completeMagicLinkLogin().
   *
   * @param email - The email address to send the magic link to
   * @returns Promise that resolves when email is sent (or fails)
   *
   * @example
   * await auth.sendMagicLink('user@example.com');
   * if (auth.magicLinkSent()) {
   *   // Show "Check your email" message
   * }
   */
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

  /**
   * Completes the magic link authentication flow.
   *
   * Call this on app initialization or auth page load to handle
   * incoming magic link URLs. Retrieves email from localStorage
   * or prompts user if not found.
   *
   * @returns Promise that resolves when authentication completes
   *
   * @example
   * // In auth page component
   * ngOnInit() {
   *   this.auth.completeMagicLinkLogin();
   * }
   */
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

  /**
   * Resets magic link state signals.
   *
   * Call this when navigating away from magic link UI
   * to clear success/error states.
   */
  resetMagicLinkState() {
    this.magicLinkSent.set(false);
    this.magicLinkEmail.set(null);
  }

  /**
   * Signs out the current user.
   *
   * Clears authentication state and redirects to login page if needed.
   *
   * @returns Promise that resolves when sign-out completes
   */
  async logout() {
    await signOut(this.auth);
  }
}
