import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../auth.service';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * Authentication page with login options.
 *
 * Provides two authentication methods:
 * - Google Sign-In (OAuth popup)
 * - Magic Link (email-based, passwordless)
 *
 * Automatically redirects to /tasks when user is authenticated.
 * Handles completion of magic link flow from email.
 *
 * @example
 * // Routes configuration
 * { path: 'auth', component: AuthPage }
 *
 * @example
 * // Template structure
 * - Google login button
 * - Email input + "Send magic link" button
 * - Magic link sent confirmation (if magicLinkSent signal is true)
 */
@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {
  private readonly router = inject(Router);

  /** Auth service exposed for template binding */
  readonly auth = inject(AuthService);

  /** Email input value for magic link */
  readonly email = signal('');

  /** Computed flag indicating if user is logged in */
  readonly isLoggedIn = computed(() => !!this.auth.user());

  constructor() {
    // Try to complete magic link login if URL contains sign-in link
    this.auth.completeMagicLinkLogin();

    // Auto-redirect to tasks when authenticated
    effect(() => {
      if (this.isLoggedIn()) {
        this.router.navigateByUrl('/tasks');
      }
    });
  }

  /** Initiates Google Sign-In flow */
  async onGoogle() {
    await this.auth.loginWithGoogle();
  }

  /** Sends magic link to email address from input */
  async onSendLink() {
    const email = this.email().trim();
    if (!email) return;

    await this.auth.sendMagicLink(email);
  }

  /**
   * Masks email for privacy display.
   *
   * @param value - Raw email address
   * @returns Masked email (e.g., "jo***@gm***.com")
   *
   * @example
   * maskEmail('john@gmail.com') // 'jo***@gm***.com'
   * maskEmail('ab@example.com') // 'a*@ex***.com'
   */
  maskEmail(value: string) {
    const email = (value || '').trim();
    const at = email.indexOf('@');
    if (at <= 1) return email;

    const name = email.slice(0, at);
    const domain = email.slice(at + 1);

    const maskedName =
      name.length <= 2
        ? name[0] + '*'
        : name.slice(0, 2) + '*'.repeat(Math.min(6, name.length - 2));

    const dot = domain.indexOf('.');
    const domainMain = dot > 0 ? domain.slice(0, dot) : domain;
    const domainRest = dot > 0 ? domain.slice(dot) : '';

    const maskedDomain =
      domainMain.length <= 2 ? domainMain[0] + '*' : domainMain.slice(0, 2) + '***';

    return `${maskedName}@${maskedDomain}${domainRest}`;
  }

  /** Resends magic link to the previously used email */
  async onResendLink() {
    const email = (this.auth.magicLinkEmail() || this.email()).trim();
    if (!email) return;

    await this.auth.sendMagicLink(email);
  }

  /** Clears magic link state to allow entering different email */
  onChangeEmail() {
    this.auth.resetMagicLinkState();
  }
}
