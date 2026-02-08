import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

type ToastType = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string) {
    this.open(message, 'success');
  }

  error(message: string) {
    this.open(message, 'error');
  }

  info(message: string) {
    this.open(message, 'info');
  }

  private open(message: string, type: ToastType) {
    const config: MatSnackBarConfig = {
      duration: type === 'error' ? 4500 : 2500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['toast', `toast--${type}`],
    };

    this.snackBar.open(message, 'OK', config);
  }
}
