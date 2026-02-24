export type QuadrantType = 
  | 'urgent_important' 
  | 'important_not_urgent' 
  | 'urgent_not_important' 
  | 'not_urgent_not_important';

export interface Task {
  id: string;
  title: string;
  quadrant: QuadrantType;
  duration: number; // accumulated duration in ms
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: number;
}

export interface Statistics {
  focusTime: number; // total focus time in ms
  restTime: number; // total rest time in ms
  quadrantFocusTime: Record<QuadrantType, number>;
}

export type AppStatus = 'resting' | 'in_progress' | 'ended';

export interface AppState {
  status: AppStatus;
  isMinimized: boolean;
  currentTaskId: string | null;
  tasks: Task[];
  startTime: number | null; // timestamp when current timer started (focus or rest)
  savedDuration: number; // accumulated duration for current session before pause/stop
  statistics: Statistics;
  lastResetDate: string; // to track daily reset
}

export const INITIAL_STATE: AppState = {
  status: 'resting',
  isMinimized: false,
  currentTaskId: null,
  tasks: [],
  startTime: null,
  savedDuration: 0,
  statistics: {
    focusTime: 0,
    restTime: 0,
    quadrantFocusTime: {
      urgent_important: 0,
      important_not_urgent: 0,
      urgent_not_important: 0,
      not_urgent_not_important: 0,
    },
  },
  lastResetDate: new Date().toDateString(),
};
