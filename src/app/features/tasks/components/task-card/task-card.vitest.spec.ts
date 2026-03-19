import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TaskCard } from './task-card';
import { Task } from '../../task';
import { DateFormatPipe } from '@/shared/pipes/date-format.pipe';
import { TasksService } from '../../tasks.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('TaskCard', () => {
  let component: TaskCard;
  let fixture: ComponentFixture<TaskCard>;
  let mockTasksService: Partial<TasksService>;

  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    order: 1,
  };

  beforeEach(async () => {
    mockTasksService = {
      delete: vi.fn().mockResolvedValue(undefined),
      toggleStatus: vi.fn().mockResolvedValue(undefined),
      isDeleting: vi.fn().mockReturnValue(false),
      isUpdating: vi.fn().mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [TaskCard, DateFormatPipe, RouterTestingModule],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCard);
    component = fixture.componentInstance;
    component.task = mockTask;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display task title', () => {
    fixture.detectChanges();
    const titleElement = fixture.nativeElement.querySelector('h3');
    expect(titleElement.textContent).toContain('Test Task');
  });

  it('should display correct priority marks', () => {
    fixture.detectChanges();
    expect(component.getPriorityMarks('low')).toBe('!');
    expect(component.getPriorityMarks('medium')).toBe('!!');
    expect(component.getPriorityMarks('high')).toBe('!!!');
  });

  it('should apply correct priority class', () => {
    fixture.detectChanges();
    const priorityElement = fixture.nativeElement.querySelector('.priority-indicator');
    expect(priorityElement.classList).toContain('priority-medium');
  });

  it('should show checkbox when selectable is true', () => {
    component.selectable = true;
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeTruthy();
  });

  it('should not show checkbox when selectable is false', () => {
    component.selectable = false;
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeFalsy();
  });

  it('should emit remove event', () => {
    const removeSpy = vi.fn();
    component.remove.subscribe(removeSpy);
    
    component.remove.emit(mockTask.id);
    
    expect(removeSpy).toHaveBeenCalledWith(mockTask.id);
  });

  it('should emit toggle event', () => {
    const toggleSpy = vi.fn();
    component.toggle.subscribe(toggleSpy);
    
    component.onComplete();
    
    expect(toggleSpy).toHaveBeenCalledWith(mockTask.id);
  });

  it('should calculate days remaining for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    component.task = { ...mockTask, dueDate: futureDate.toISOString() };
    
    fixture.detectChanges();
    
    const daysRemaining = component.daysRemaining();
    expect(daysRemaining).not.toBeNull();
    expect(daysRemaining?.days).toBe(5);
    expect(daysRemaining?.overdue).toBe(false);
  });

  it('should calculate overdue for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    component.task = { ...mockTask, dueDate: pastDate.toISOString() };
    
    fixture.detectChanges();
    
    const daysRemaining = component.daysRemaining();
    expect(daysRemaining).not.toBeNull();
    expect(daysRemaining?.overdue).toBe(true);
    expect(daysRemaining?.days).toBe(3);
  });

  it('should show high priority pulsing animation', () => {
    component.task = { ...mockTask, priority: 'high' };
    fixture.detectChanges();
    
    const priorityElement = fixture.nativeElement.querySelector('.priority-indicator');
    expect(priorityElement.classList).toContain('pulsing');
  });
});
