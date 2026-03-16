import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

/**
 * Service for opening confirmation dialogs.
 *
 * Provides a promise-based API for asking users to confirm actions.
 * Automatically handles dialog lifecycle and returns boolean result.
 *
 * @example
 * // Basic usage
 * async deleteTask(task: Task) {
 *   const confirmed = await this.confirm.open({
 *     title: 'Delete Task',
 *     message: `Delete "${task.title}"?`,
 *     confirmText: 'Delete',
 *     cancelText: 'Keep'
 *   });
 *
 *   if (confirmed) {
 *     await this.tasksService.delete(task.id);
 *   }
 * }
 *
 * @example
 * // With minimal config (uses defaults)
 * const confirmed = await this.confirm.open({
 *   message: 'Are you sure?'
 * });
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private dialog = inject(MatDialog);

  /**
   * Opens a confirmation dialog with the given configuration.
   *
   * @param data - Dialog configuration including title, message, and button texts
   * @returns Promise that resolves to:
   *   - `true` if user clicked confirm
   *   - `false` if user clicked cancel or closed the dialog
   */
  async open(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data,
    });

    const result = await firstValueFrom(ref.afterClosed());
    return Boolean(result);
  }
}
