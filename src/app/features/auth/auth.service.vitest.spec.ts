import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/firebase.config', () => ({
  firebaseApp: {
    name: '[DEFAULT]',
    options: {
      apiKey: 'fake-api-key',
      authDomain: 'fake.firebaseapp.com',
      projectId: 'fake-project',
    },
  },
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    onAuthStateChanged: vi.fn((cb: any) => {
      cb(null);
      return vi.fn();
    }),
    signInWithPopup: vi.fn(),
    signInWithEmailLink: vi.fn(),
    signOut: vi.fn(),
  })),
  GoogleAuthProvider: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(() => false),
}));

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
  });

  it('should reset magic link state', () => {
    service.magicLinkSent.set(true);
    service.magicLinkEmail.set('test@test.pl');

    service.resetMagicLinkState();

    expect(service.magicLinkSent()).toBe(false);
    expect(service.magicLinkEmail()).toBe(null);
  });

  it('should map invalid-email error', () => {
    const error = { code: 'auth/invalid-email' };

    const message = (service as any)['toUserMessage'](error);

    expect(message).toBe('Nieprawidłowy adres email.');
  });
});
