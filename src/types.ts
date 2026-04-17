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

export interface DailyTaskStats {
  id: string;
  title: string;
  duration: number;
  quadrant: QuadrantType;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface Statistics {
  focusTime: number; // total focus time in ms
  restTime: number; // total rest time in ms
  quadrantFocusTime: Record<QuadrantType, number>;
  taskStats: Record<string, DailyTaskStats>; // taskId -> stats
}

export type AppStatus = 'resting' | 'in_progress' | 'ended';

export interface AutoStopSettings {
  enabled: boolean;
  time: string; // HH:mm format
}

export interface AutoRestSettings {
  enabled: boolean;
  lunchTime: string; // HH:mm format
  nightTime: string; // HH:mm format
}

export interface TaskStartReminderSettings {
  enabled: boolean;
  time: string; // HH:mm format
}

export interface AppState {
  status: AppStatus;
  isMinimized: boolean;
  currentTaskId: string | null;
  tasks: Task[];
  startTime: number | null; // timestamp when current timer started (focus or rest)
  savedDuration: number; // accumulated duration for current session before pause/stop
  statistics: Statistics;
  history: Record<string, Statistics>; // Historical statistics by date (YYYY-MM-DD)
  selectedDate: string; // Date to display statistics for
  lastResetDate: string; // to track daily reset
  autoStopSettings: AutoStopSettings;
  lastAutoStopDate: string | null; // date string when auto-stop was last triggered
  autoRestSettings: AutoRestSettings;
  lastAutoRestDate: {
    lunch: string | null;
    night: string | null;
  };
  taskStartReminderSettings: TaskStartReminderSettings;
  lastTaskStartReminderDate: string | null;
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
    taskStats: {},
  },
  history: {},
  selectedDate: new Date().toDateString(),
  lastResetDate: new Date().toDateString(),
  autoStopSettings: {
    enabled: false,
    time: '23:00',
  },
  lastAutoStopDate: null,
  autoRestSettings: {
    enabled: false,
    lunchTime: '12:30',
    nightTime: '22:30',
  },
  lastAutoRestDate: {
    lunch: null,
    night: null,
  },
  taskStartReminderSettings: {
    enabled: false,
    time: '09:00',
  },
  lastTaskStartReminderDate: null,
};
