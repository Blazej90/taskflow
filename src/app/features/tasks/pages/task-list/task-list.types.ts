import { TaskStatus } from '../../task';

/** Filter option for task status */
export type Filter = 'all' | TaskStatus;

/** Date filter options */
export type DateFilter = 'all' | 'overdue' | 'due-today';

/** Task sorting options */
export type SortOption = 'manual' | 'dueDate' | 'priority' | 'status' | 'newest' | 'oldest';

/** Display mode for task list */
export type ViewMode = 'list' | 'board';
