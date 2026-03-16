import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/**
 * Data passed to the confirmation dialog.
 *
 * @example
 * const dialogData: ConfirmDialogData = {
 *   title: 'Delete Task',
 *   message: 'Are you sure you want to delete "My Task"?',
 *   confirmText: 'Delete',
 *   cancelText: 'Cancel'
 * };
 */
export type ConfirmDialogData = {
  /** Dialog title displayed in the header (defaults to 'Confirm') */
  title?: string;

  /** Main message/question displayed to the user (required) */
  message: string;

  /** Text for the confirm action button (defaults to 'Delete') */
  confirmText?: string;

  /** Text for the cancel button (defaults to 'Cancel') */
  cancelText?: string;
};

/**
 * Confirmation dialog component.
 *
 * Displays a modal dialog with a title, message, and two action buttons.
 * Typically used for destructive actions like delete confirmations.
 *
 * @example
 * // Usage via ConfirmService (recommended)
 * const confirmed = await this.confirm.open({
 *   title: 'Delete Task',
 *   message: 'Are you sure?'
 * });
 *
 * if (confirmed) {
 *   // proceed with deletion
 * }
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title ?? 'Confirm' }}</h2>

    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close(false)">
        {{ data.cancelText ?? 'Cancel' }}
      </button>

      <button mat-flat-button color="warn" type="button" (click)="close(true)" cdkFocusInitial>
        {{ data.confirmText ?? 'Delete' }}
      </button>
    </div>
  `,
})
export class ConfirmDialog {
  private dialogRef = inject(MatDialogRef<ConfirmDialog, boolean>);

  /** Dialog configuration data injected from the opener */
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  /**
   * Closes the dialog with the given result.
   *
   * @param result - true if confirmed, false if cancelled
   */
  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
