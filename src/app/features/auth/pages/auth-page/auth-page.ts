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
}
