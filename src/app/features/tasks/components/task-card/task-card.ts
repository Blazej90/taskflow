import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Task } from '../../task';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  @Input({ required: true }) task!: Task;
}
