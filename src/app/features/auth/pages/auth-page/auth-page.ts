import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../auth.service';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly email = signal('');

  readonly isLoggedIn = computed(() => !!this.auth.user());

  constructor() {
    this.auth.completeMagicLinkLogin();

    effect(() => {
      if (this.isLoggedIn()) {
        this.router.navigateByUrl('/tasks');
      }
    });
  }

  async onGoogle() {
    await this.auth.loginWithGoogle();
  }

  async onSendLink() {
    const email = this.email().trim();
    if (!email) return;

    await this.auth.sendMagicLink(email);
  }

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

  async onResendLink() {
    const email = (this.auth.magicLinkEmail() || this.email()).trim();
    if (!email) return;

    await this.auth.sendMagicLink(email);
  }

  onChangeEmail() {
    this.auth.resetMagicLinkState();
  }
}
