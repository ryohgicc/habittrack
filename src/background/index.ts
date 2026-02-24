import { INITIAL_STATE } from '../types';
import type { AppState, Task } from '../types';

let appState: AppState = { ...INITIAL_STATE };

// Load state from storage
chrome.storage.local.get(['appState'], (result) => {
  if (result.appState) {
    appState = result.appState as AppState;
    checkDailyReset();
  } else {
    saveState();
  }
});

function saveState() {
  chrome.storage.local.set({ appState });
  // Notify all tabs about state change
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'STATE_UPDATE', payload: appState }).catch(() => {
          // Ignore error if tab doesn't have content script
        });
      }
    });
  });
}

function checkDailyReset() {
  const today = new Date().toDateString();
  if (appState.lastResetDate !== today) {
    appState.statistics = {
      focusTime: 0,
      restTime: 0,
      quadrantFocusTime: {
        urgent_important: 0,
        important_not_urgent: 0,
        urgent_not_important: 0,
        not_urgent_not_important: 0,
      },
    };
    appState.lastResetDate = today;
    saveState();
  }
}

// Handle messages
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.type) {
    case 'GET_STATE':
      sendResponse(appState);
      break;
    
    case 'ADD_TASK':
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: message.payload.title,
        quadrant: message.payload.quadrant,
        duration: 0,
        status: 'pending',
        createdAt: Date.now(),
      };
      appState.tasks.push(newTask);
      saveState();
      break;

    case 'DELETE_TASK':
      const taskToDeleteId = message.payload.taskId;
      // If the task to delete is currently running, stop the timer first
      if (appState.currentTaskId === taskToDeleteId && appState.status === 'in_progress') {
        stopCurrentTimer();
        appState.status = 'resting'; // Revert to resting or idle? Let's go to resting or just stop.
        appState.status = 'ended'; // Let's stop.
        appState.currentTaskId = null;
        appState.startTime = null;
      }
      appState.tasks = appState.tasks.filter(t => t.id !== taskToDeleteId);
      saveState();
      break;

    case 'START_TASK':
      // Stop current timer (rest or other task)
      stopCurrentTimer();
      
      appState.status = 'in_progress';
      appState.currentTaskId = message.payload.taskId;
      appState.startTime = Date.now();
      appState.savedDuration = 0; // Starting new session for this task
      
      // Update task status
      const taskIndex = appState.tasks.findIndex(t => t.id === message.payload.taskId);
      if (taskIndex !== -1) {
        appState.tasks[taskIndex].status = 'in_progress';
      }
      saveState();
      break;

    case 'START_REST':
      stopCurrentTimer();
      
      appState.status = 'resting';
      appState.currentTaskId = null;
      appState.startTime = Date.now();
      appState.savedDuration = 0;
      saveState();
      break;

    case 'STOP_ALL':
      stopCurrentTimer();
      appState.status = 'ended';
      appState.currentTaskId = null;
      appState.startTime = null;
      saveState();
      break;

    case 'TOGGLE_MINIMIZED':
      appState.isMinimized = !appState.isMinimized;
      saveState();
      break;
      
    case 'UPDATE_TASK_DURATION':
       // This might be called periodically or on stop to save progress
       // But better to calculate on stop.
       break;
  }
  return true;
});

function stopCurrentTimer() {
  if (appState.startTime) {
    const elapsed = Date.now() - appState.startTime;
    
    if (appState.status === 'in_progress' && appState.currentTaskId) {
      const taskIndex = appState.tasks.findIndex(t => t.id === appState.currentTaskId);
      if (taskIndex !== -1) {
        appState.tasks[taskIndex].duration += elapsed;
        appState.statistics.focusTime += elapsed;
        appState.statistics.quadrantFocusTime[appState.tasks[taskIndex].quadrant] += elapsed;
      }
    } else if (appState.status === 'resting') {
      appState.statistics.restTime += elapsed;
    }
  }
  appState.startTime = null;
}
