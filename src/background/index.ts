import { INITIAL_STATE } from '../types';
import type { AppState, Task } from '../types';

let appState: AppState = { ...INITIAL_STATE };

// Load state from storage
chrome.storage.local.get(['appState'], (result) => {
  if (result.appState) {
    appState = result.appState as AppState;
    // Migration for new fields
    if (!appState.history) appState.history = {};
    if (!appState.selectedDate) appState.selectedDate = new Date().toDateString();
    if (!appState.statistics.taskStats) appState.statistics.taskStats = {};
    
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
    // Save previous day's statistics
    if (!appState.history) appState.history = {};
    appState.history[appState.lastResetDate] = { ...appState.statistics };

    appState.statistics = {
      focusTime: 0,
      restTime: 0,
      quadrantFocusTime: {
        urgent_important: 0,
        important_not_urgent: 0,
        urgent_not_important: 0,
        not_urgent_not_important: 0,
      },
      taskStats: {},
    };
    
    // Reset task durations to 0
    appState.tasks.forEach(task => {
      task.duration = 0;
    });

    // If currently focusing, reset savedDuration to 0 as well
    if (appState.status === 'in_progress') {
      appState.savedDuration = 0;
      // Note: startTime is kept as is. The displayed time will be (now - startTime).
      // Effectively resetting the "previous accumulated" time.
    } else if (appState.status === 'resting') {
       appState.savedDuration = 0;
    }

    appState.lastResetDate = today;
    appState.selectedDate = today; // Reset selection to today
    saveState();
  }
}

// Handle messages
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  // Check for daily reset on every interaction to handle day changes while running
  checkDailyReset();

  switch (message.type) {
    case 'GET_STATE':
      sendResponse(appState);
      break;
    
    case 'SET_SELECTED_DATE':
      appState.selectedDate = message.payload.date;
      saveState();
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
    
    case 'EDIT_TASK':
      const taskToEdit = appState.tasks.find(t => t.id === message.payload.taskId);
      if (taskToEdit) {
        taskToEdit.title = message.payload.title;
        // Sync to taskStats if exists
        if (appState.statistics.taskStats && appState.statistics.taskStats[taskToEdit.id]) {
          appState.statistics.taskStats[taskToEdit.id].title = message.payload.title;
        }
        saveState();
      }
      break;

    case 'COMPLETE_TASK':
      const taskToComplete = appState.tasks.find(t => t.id === message.payload.taskId);
      if (taskToComplete) {
        // If running, stop it first
        if (appState.currentTaskId === taskToComplete.id && appState.status === 'in_progress') {
           stopCurrentTimer();
           appState.status = 'resting'; // Or idle
           appState.currentTaskId = null;
        }
        
        taskToComplete.status = 'completed';
        
        // Sync to taskStats if exists
        if (!appState.statistics.taskStats) {
            appState.statistics.taskStats = {};
        }
        if (!appState.statistics.taskStats[taskToComplete.id]) {
            appState.statistics.taskStats[taskToComplete.id] = {
                id: taskToComplete.id,
                title: taskToComplete.title,
                duration: taskToComplete.duration,
                quadrant: taskToComplete.quadrant,
                status: 'completed'
            };
        } else {
            appState.statistics.taskStats[taskToComplete.id].status = 'completed';
        }
        
        saveState();
      }
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
      
      // Update task status and set savedDuration to accumulated duration
      const taskIndex = appState.tasks.findIndex(t => t.id === message.payload.taskId);
      if (taskIndex !== -1) {
        appState.tasks[taskIndex].status = 'in_progress';
        // When starting a task, we want the displayed timer to include past duration
        // savedDuration is used in UI as the base value.
        appState.savedDuration = appState.tasks[taskIndex].duration;
      } else {
        appState.savedDuration = 0;
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
        const task = appState.tasks[taskIndex];
        task.duration += elapsed;
        appState.statistics.focusTime += elapsed;
        appState.statistics.quadrantFocusTime[task.quadrant] += elapsed;

        // Update task stats
        if (!appState.statistics.taskStats) {
           appState.statistics.taskStats = {};
        }
        if (!appState.statistics.taskStats[task.id]) {
          appState.statistics.taskStats[task.id] = {
            id: task.id,
            title: task.title,
            duration: 0,
            quadrant: task.quadrant,
          };
        }
        appState.statistics.taskStats[task.id].duration += elapsed;
        // Also update title and quadrant in case they changed (though title change not implemented yet)
        appState.statistics.taskStats[task.id].title = task.title;
        appState.statistics.taskStats[task.id].quadrant = task.quadrant;
      }
    } else if (appState.status === 'resting') {
      appState.statistics.restTime += elapsed;
    }
  }
  appState.startTime = null;
}
