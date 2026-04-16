import { INITIAL_STATE } from '../types';
import type { AppState, Task } from '../types';

let appState: AppState = { ...INITIAL_STATE };
let isStateLoaded = false;
let stateLoadPromise: Promise<void>;

// Load state from storage
stateLoadPromise = new Promise((resolve) => {
  chrome.storage.local.get(['appState'], (result) => {
    if (result.appState) {
      appState = result.appState as AppState;
      // Migration for new fields
      if (!appState.history) appState.history = {};
      if (!appState.selectedDate) appState.selectedDate = new Date().toDateString();
      if (!appState.statistics.taskStats) appState.statistics.taskStats = {};
      if (!appState.autoStopSettings) appState.autoStopSettings = { enabled: false, time: '23:00' };
      if (appState.lastAutoStopDate === undefined) appState.lastAutoStopDate = null;
      if (!appState.autoRestSettings) appState.autoRestSettings = { enabled: false, lunchTime: '12:30', nightTime: '22:30' };
      if (!appState.lastAutoRestDate) appState.lastAutoRestDate = { lunch: null, night: null };
      if (!appState.taskStartReminderSettings) appState.taskStartReminderSettings = { enabled: false, time: '09:00' };
      if (appState.lastTaskStartReminderDate === undefined) appState.lastTaskStartReminderDate = null;
      if (appState.taskStartReminderActive === undefined) appState.taskStartReminderActive = false;
      
      checkDailyReset();
      // Setup auto-stop alarm
      setupAutoStopAlarm();
    } else {
      saveState();
    }
    isStateLoaded = true;
    resolve();
  });
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
    appState.lastAutoStopDate = null; // Reset auto stop trigger for the new day
    appState.lastAutoRestDate = { lunch: null, night: null };
    appState.lastTaskStartReminderDate = null;
    appState.taskStartReminderActive = false;
    saveState();
  }
}

// Handle messages
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  // Check for daily reset on every interaction to handle day changes while running
  checkDailyReset();
  checkAutoRest();
  checkTaskStartReminder();

  const handleMessage = async () => {
    if (!isStateLoaded) {
      await stateLoadPromise;
    }

    switch (message.type) {
      case 'GET_STATE':
        sendResponse(appState);
        break;
      
      case 'SET_SELECTED_DATE':
        appState.selectedDate = message.payload.date;
        saveState();
        break;
      
      case 'RESET_DAILY_STATS':
        // Only reset if it's for today
        if (!appState.selectedDate || new Date(appState.selectedDate).toDateString() === new Date().toDateString()) {
          // Reset statistics
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

          // Reset current session timer if running
          if (appState.status === 'in_progress') {
            appState.savedDuration = 0;
            appState.startTime = Date.now(); // Restart timer from now
          } else if (appState.status === 'resting') {
             appState.savedDuration = 0;
             appState.startTime = Date.now();
          }
          
          saveState();
        }
        break;
  
      case 'UPDATE_AUTO_STOP_SETTINGS':
        appState.autoStopSettings = message.payload;
        // Reset lastAutoStopDate if user changes settings to allow re-triggering?
        // Maybe not necessary, but if they change time to later today, it should trigger again.
        // For simplicity, let's reset lastAutoStopDate if they disable it, or just keep it.
        // If they change time to a future time today, and lastAutoStopDate is today, it won't trigger.
        // Let's clear lastAutoStopDate if the new time is in the future compared to now.
        const [h, m] = message.payload.time.split(':').map(Number);
        const newTarget = new Date();
        newTarget.setHours(h, m, 0, 0);
        if (newTarget > new Date()) {
           appState.lastAutoStopDate = null;
        }
        
        saveState();
        setupAutoStopAlarm(); // Ensure alarm is running
        break;

      case 'UPDATE_AUTO_REST_SETTINGS':
        appState.autoRestSettings = message.payload;
        const now = new Date();
        const [lunchHour, lunchMinute] = message.payload.lunchTime.split(':').map(Number);
        const [nightHour, nightMinute] = message.payload.nightTime.split(':').map(Number);
        const lunchTarget = new Date();
        lunchTarget.setHours(lunchHour, lunchMinute, 0, 0);
        const nightTarget = new Date();
        nightTarget.setHours(nightHour, nightMinute, 0, 0);
        if (lunchTarget > now) appState.lastAutoRestDate.lunch = null;
        if (nightTarget > now) appState.lastAutoRestDate.night = null;
        saveState();
        setupAutoStopAlarm(); // Reuse same periodic alarm
        break;

      case 'UPDATE_TASK_START_REMINDER_SETTINGS':
        appState.taskStartReminderSettings = message.payload;
        const [remindHour, remindMinute] = message.payload.time.split(':').map(Number);
        const remindTarget = new Date();
        remindTarget.setHours(remindHour, remindMinute, 0, 0);
        if (remindTarget > new Date()) {
          appState.lastTaskStartReminderDate = null;
        }
        appState.taskStartReminderActive = false;
        saveState();
        setupAutoStopAlarm(); // Reuse same periodic alarm
        break;

      case 'DISMISS_TASK_START_REMINDER':
        appState.taskStartReminderActive = false;
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
        appState.taskStartReminderActive = false;
        appState.lastTaskStartReminderDate = new Date().toDateString();
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
  };

  handleMessage();
  return true; // Indicates async response
});

// Alarm setup
function setupAutoStopAlarm() {
  chrome.alarms.create('checkAutoStop', { periodInMinutes: 1 });
}

// Alarm handler
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkAutoStop') {
    // Check for daily reset as well in the alarm to ensure timely updates
    checkDailyReset();
    checkTaskStartReminder();
    checkAutoRest();
    checkAutoStop();
  }
});

function checkTaskStartReminder() {
  if (!appState.taskStartReminderSettings?.enabled) return;

  const now = new Date();
  const today = now.toDateString();
  if (appState.lastTaskStartReminderDate === today) return;

  const [targetHour, targetMinute] = appState.taskStartReminderSettings.time.split(':').map(Number);
  const targetTime = new Date();
  targetTime.setHours(targetHour, targetMinute, 0, 0);

  if (now < targetTime) return;

  const hasStartedTaskToday = (
    appState.status === 'in_progress' ||
    appState.statistics.focusTime > 0 ||
    appState.tasks.some((task) => task.duration > 0)
  );

  appState.lastTaskStartReminderDate = today;
  appState.taskStartReminderActive = !hasStartedTaskToday;
  saveState();
}

function checkAutoRest() {
  if (!appState.autoRestSettings?.enabled) return;

  const now = new Date();
  const today = now.toDateString();

  const maybeTrigger = (time: string, slot: 'lunch' | 'night') => {
    const [targetHour, targetMinute] = time.split(':').map(Number);
    const targetTime = new Date();
    targetTime.setHours(targetHour, targetMinute, 0, 0);

    if (now < targetTime || appState.lastAutoRestDate[slot] === today) {
      return;
    }

    if (appState.status === 'in_progress') {
      stopCurrentTimer();
      appState.status = 'resting';
      appState.currentTaskId = null;
      appState.startTime = Date.now();
      appState.savedDuration = 0;
      appState.lastAutoRestDate[slot] = today;
      saveState();
    }
  };

  maybeTrigger(appState.autoRestSettings.lunchTime, 'lunch');
  maybeTrigger(appState.autoRestSettings.nightTime, 'night');
}

function checkAutoStop() {
  if (!appState.autoStopSettings?.enabled) return;
  
  const now = new Date();
  const today = now.toDateString();
  const [targetHour, targetMinute] = appState.autoStopSettings.time.split(':').map(Number);
  
  // Create date object for target time today
  const targetTime = new Date();
  targetTime.setHours(targetHour, targetMinute, 0, 0);

  // If current time is past target time AND we haven't triggered it today yet
  if (now >= targetTime && appState.lastAutoStopDate !== today) {
    if (appState.status === 'in_progress' || appState.status === 'resting') {
      stopCurrentTimer();
      appState.status = 'ended';
      appState.currentTaskId = null;
      appState.startTime = null;
      appState.lastAutoStopDate = today;
      saveState();
      console.log('Auto-stopped tasks at', now.toLocaleTimeString());
    } else {
       // Even if not running, mark as triggered so we don't trigger if user starts later?
       // Requirement: "prevent me from forgetting to close". 
       // If user starts AFTER the time, maybe they intend to work late.
       // But usually this feature means "stop everything at X time".
       // Let's just mark it as triggered for today to avoid repeated stopping every minute.
       appState.lastAutoStopDate = today;
       saveState();
    }
  }
}

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
