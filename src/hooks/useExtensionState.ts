import { useState, useEffect } from 'react';
import { INITIAL_STATE } from '../types';
import type { AppState, QuadrantType } from '../types';

export function useExtensionState() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [taskStartReminderVisible, setTaskStartReminderVisible] = useState(false);

  useEffect(() => {
    const fetchLatestState = () => {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
        if (response) {
          setState(response);
        }
        setLoading(false);
      });
    };

    // Initial fetch
    fetchLatestState();

    // Listen for updates
    const listener = (message: any) => {
      if (message.type === 'STATE_UPDATE') {
        setState(message.payload);
      }
      if (message.type === 'TRIGGER_TASK_START_REMINDER') {
        setTaskStartReminderVisible(true);
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

    chrome.runtime.onMessage.addListener(listener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const addTask = (title: string, quadrant: QuadrantType) => {
    chrome.runtime.sendMessage({ type: 'ADD_TASK', payload: { title, quadrant } });
  };

  const startTask = (taskId: string) => {
    chrome.runtime.sendMessage({ type: 'START_TASK', payload: { taskId } });
  };

  const startRest = () => {
    chrome.runtime.sendMessage({ type: 'START_REST' });
  };

  const stopAll = () => {
    chrome.runtime.sendMessage({ type: 'STOP_ALL' });
  };

  const toggleMinimized = () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_MINIMIZED' });
  };

  const setSelectedDate = (date: string) => {
    chrome.runtime.sendMessage({ type: 'SET_SELECTED_DATE', payload: { date } });
  };

  const resetDailyStats = () => {
    chrome.runtime.sendMessage({ type: 'RESET_DAILY_STATS' });
  };

  const deleteTask = (taskId: string) => {
    chrome.runtime.sendMessage({ type: 'DELETE_TASK', payload: { taskId } });
  };

  const editTask = (taskId: string, title: string) => {
    chrome.runtime.sendMessage({ type: 'EDIT_TASK', payload: { taskId, title } });
  };

  const completeTask = (taskId: string) => {
    chrome.runtime.sendMessage({ type: 'COMPLETE_TASK', payload: { taskId } });
  };

  const updateAutoStopSettings = (settings: { enabled: boolean; time: string }) => {
    chrome.runtime.sendMessage({ type: 'UPDATE_AUTO_STOP_SETTINGS', payload: settings });
  };

  const updateAutoRestSettings = (settings: { enabled: boolean; lunchTime: string; nightTime: string }) => {
    chrome.runtime.sendMessage({ type: 'UPDATE_AUTO_REST_SETTINGS', payload: settings });
  };

  const updateTaskStartReminderSettings = (settings: { enabled: boolean; time: string }) => {
    chrome.runtime.sendMessage({ type: 'UPDATE_TASK_START_REMINDER_SETTINGS', payload: settings });
  };

  const dismissTaskStartReminder = () => {
    setTaskStartReminderVisible(false);
  };

  const scheduleTaskStartReminderTest = (delayMinutes: number) => {
    chrome.runtime.sendMessage({ type: 'SCHEDULE_TASK_START_REMINDER_TEST', payload: { delayMinutes } });
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
    scheduleTaskStartReminderTest,
    taskStartReminderVisible,
  };
}
