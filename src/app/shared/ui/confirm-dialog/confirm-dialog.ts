import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export type ConfirmDialogData = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

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
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
