import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/** Type of toast notification determining its appearance and duration */
type ToastType = 'success' | 'error' | 'info';

/**
 * Service for displaying toast notifications to the user.
 *
 * Provides a simple API for showing success, error, and info messages
 * using Angular Material's SnackBar component.
 *
 * @example
 * // Inject and use in a component
 * constructor(private toast: ToastService) {}
 *
 * async deleteTask() {
 *   try {
 *     await this.api.delete(id);
 *     this.toast.success('Task deleted successfully');
 *   } catch {
 *     this.toast.error('Failed to delete task');
 *   }
 * }
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Displays a success toast notification.
   * Auto-dismisses after 2.5 seconds with green styling.
   *
   * @param message - The success message to display
   */
  success(message: string) {
    this.open(message, 'success');
  }

  /**
   * Displays an error toast notification.
   * Auto-dismisses after 4.5 seconds with red styling.
   * Longer duration allows users to read error details.
   *
   * @param message - The error message to display
   */
  error(message: string) {
    this.open(message, 'error');
  }

  /**
   * Displays an informational toast notification.
   * Auto-dismisses after 2.5 seconds with blue styling.
   *
   * @param message - The info message to display
   */
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
