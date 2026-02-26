import { useState, useEffect } from 'react';
import { INITIAL_STATE } from '../types';
import type { AppState, QuadrantType } from '../types';

export function useExtensionState() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (response) {
        setState(response);
      }
      setLoading(false);
    });

    // Listen for updates
    const listener = (message: any) => {
      if (message.type === 'STATE_UPDATE') {
        setState(message.payload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
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

  const deleteTask = (taskId: string) => {
    chrome.runtime.sendMessage({ type: 'DELETE_TASK', payload: { taskId } });
  };

  const editTask = (taskId: string, title: string) => {
    chrome.runtime.sendMessage({ type: 'EDIT_TASK', payload: { taskId, title } });
  };

  const completeTask = (taskId: string) => {
    chrome.runtime.sendMessage({ type: 'COMPLETE_TASK', payload: { taskId } });
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
  };
}
