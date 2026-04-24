import { useState, useEffect } from 'react';
import { INITIAL_STATE } from '../types';
import type { AppState, QuadrantType } from '../types';

function isExtensionContextAvailable() {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

type RuntimeMessage = {
  type?: string;
  payload?: AppState;
};

function safeSendRuntimeMessage(message: unknown, onResponse?: (response: unknown) => void) {
  if (!isExtensionContextAvailable()) {
    onResponse?.(undefined);
    return false;
  }

  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime?.lastError) {
        onResponse?.(undefined);
        return;
      }

      onResponse?.(response);
    });
    return true;
  } catch {
    onResponse?.(undefined);
    return false;
  }
}

export function useExtensionState() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [taskStartReminderVisible, setTaskStartReminderVisible] = useState(false);

  useEffect(() => {
    const fetchLatestState = () => {
      const sent = safeSendRuntimeMessage({ type: 'GET_STATE' }, (response) => {
        if (response) {
          setState(response as AppState);
        }
        setLoading(false);
      });

      if (!sent) {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchLatestState();

    // Listen for updates
    const listener = (message: unknown) => {
      if (!message || typeof message !== 'object') {
        return;
      }

      const runtimeMessage = message as RuntimeMessage;

      if (runtimeMessage.type === 'STATE_UPDATE' && runtimeMessage.payload) {
        setState(runtimeMessage.payload);
      }
      if (runtimeMessage.type === 'TRIGGER_TASK_START_REMINDER') {
        setTaskStartReminderVisible(true);
      }
    };

    const storageListener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName !== 'local') {
        return;
      }

      const nextState = changes.appState?.newValue as AppState | undefined;
      if (nextState) {
        setState(nextState);
      }
    };

    // Tabs may miss broadcast updates while suspended/discarded.
    // Refetch state when page becomes active again.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestState();
      }
    };

    const handleFocus = () => {
      fetchLatestState();
    };

    const handlePageShow = () => {
      fetchLatestState();
    };

    if (!isExtensionContextAvailable()) {
      return () => undefined;
    }

    chrome.runtime.onMessage.addListener(listener);
    chrome.storage.onChanged.addListener(storageListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      chrome.storage.onChanged.removeListener(storageListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const addTask = (title: string, quadrant: QuadrantType) => {
    safeSendRuntimeMessage({ type: 'ADD_TASK', payload: { title, quadrant } });
  };

  const startTask = (taskId: string) => {
    safeSendRuntimeMessage({ type: 'START_TASK', payload: { taskId } });
  };

  const startRest = () => {
    safeSendRuntimeMessage({ type: 'START_REST' });
  };

  const stopAll = () => {
    safeSendRuntimeMessage({ type: 'STOP_ALL' });
  };

  const toggleMinimized = () => {
    safeSendRuntimeMessage({ type: 'TOGGLE_MINIMIZED' });
  };

  const setSelectedDate = (date: string) => {
    safeSendRuntimeMessage({ type: 'SET_SELECTED_DATE', payload: { date } });
  };

  const resetDailyStats = () => {
    safeSendRuntimeMessage({ type: 'RESET_DAILY_STATS' });
  };

  const deleteTask = (taskId: string) => {
    safeSendRuntimeMessage({ type: 'DELETE_TASK', payload: { taskId } });
  };

  const editTask = (taskId: string, title: string) => {
    safeSendRuntimeMessage({ type: 'EDIT_TASK', payload: { taskId, title } });
  };

  const completeTask = (taskId: string) => {
    safeSendRuntimeMessage({ type: 'COMPLETE_TASK', payload: { taskId } });
  };

  const updateAutoStopSettings = (settings: { enabled: boolean; time: string }) => {
    safeSendRuntimeMessage({ type: 'UPDATE_AUTO_STOP_SETTINGS', payload: settings });
  };

  const updateAutoRestSettings = (settings: { enabled: boolean; lunchTime: string; nightTime: string }) => {
    safeSendRuntimeMessage({ type: 'UPDATE_AUTO_REST_SETTINGS', payload: settings });
  };

  const updateTaskStartReminderSettings = (settings: { enabled: boolean; time: string }) => {
    safeSendRuntimeMessage({ type: 'UPDATE_TASK_START_REMINDER_SETTINGS', payload: settings });
  };

  const dismissTaskStartReminder = () => {
    setTaskStartReminderVisible(false);
  };

  return {
    state,
    loading,
    addTask,
    deleteTask,
    editTask,
    completeTask,
    startTask,
    startRest,
    stopAll,
    toggleMinimized,
    setSelectedDate,
    resetDailyStats,
    updateAutoStopSettings,
    updateAutoRestSettings,
    updateTaskStartReminderSettings,
    dismissTaskStartReminder,
    taskStartReminderVisible,
  };
}
