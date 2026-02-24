import React, { useState } from 'react';
import { useExtensionState } from '../hooks/useExtensionState';
import { Quadrant } from './Quadrant';
import type { Task } from '../types';
import clsx from 'clsx';
import { Minus, PieChart, Pause, Square, ChevronLeft } from 'lucide-react';

const Widget: React.FC = () => {
  const { state, loading, addTask, startTask, startRest, stopAll, toggleMinimized } = useExtensionState();
  const [showStats, setShowStats] = useState(false);

  // Helper to format duration for tasks
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // We need a global "now" to update all active timers in sync
  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getActiveTaskDuration = (task: Task) => {
    if (state.status === 'in_progress' && state.currentTaskId === task.id && state.startTime) {
      return formatDuration(task.duration + (now - state.startTime));
    }
    return formatDuration(task.duration);
  };

  const currentTask = state.tasks.find(t => t.id === state.currentTaskId);
  
  if (loading) return null;

  if (state.isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center space-x-2 cursor-pointer border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform z-[2147483647]"
        onClick={toggleMinimized}
      >
        <div className={clsx("w-2 h-2 rounded-full", state.status === 'in_progress' ? 'bg-green-500' : state.status === 'resting' ? 'bg-blue-500' : 'bg-gray-400')} />
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {state.status === 'in_progress' ? currentTask?.title : state.status === 'resting' ? 'Resting' : 'Idle'}
        </span>
        <span className="text-xs text-gray-500 font-mono">
          {state.startTime ? formatDuration(state.savedDuration + (now - state.startTime)) : formatDuration(0)}
        </span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[400px] h-[500px] bg-white dark:bg-gray-900 shadow-2xl rounded-xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden z-[2147483647] font-sans">
      {/* Header */}
      <div className="h-14 bg-gray-50 dark:bg-gray-800 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-2 overflow-hidden">
          {showStats ? (
             <button onClick={() => setShowStats(false)} className="p-1 hover:bg-gray-200 rounded-full">
               <ChevronLeft size={18} />
             </button>
          ) : (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                {state.status === 'in_progress' ? 'Focusing' : state.status === 'resting' ? 'Resting' : 'Ready'}
              </span>
              <span className="text-sm font-semibold truncate text-gray-800 dark:text-gray-100">
                 {state.status === 'in_progress' ? currentTask?.title : state.status === 'resting' ? 'Take a break' : 'Select a task'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
           {!showStats && (
             <div className="text-lg font-mono font-medium text-blue-600 dark:text-blue-400 mr-2">
               {state.startTime ? formatDuration(state.savedDuration + (now - state.startTime)) : '00:00'}
             </div>
           )}
           <button onClick={() => setShowStats(!showStats)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600">
             <PieChart size={18} />
           </button>
           <button onClick={toggleMinimized} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600">
             <Minus size={18} />
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {showStats ? (
          <div className="absolute inset-0 p-6 overflow-y-auto bg-white dark:bg-gray-900">
             <h2 className="text-lg font-bold mb-4">Today's Statistics</h2>
             <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-blue-50 p-4 rounded-lg">
                 <div className="text-xs text-blue-500 uppercase mb-1">Focus Time</div>
                 <div className="text-2xl font-mono font-bold text-blue-700">{formatDuration(state.statistics.focusTime)}</div>
               </div>
               <div className="bg-green-50 p-4 rounded-lg">
                 <div className="text-xs text-green-500 uppercase mb-1">Rest Time</div>
                 <div className="text-2xl font-mono font-bold text-green-700">{formatDuration(state.statistics.restTime)}</div>
               </div>
             </div>
             <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase">Quadrant Breakdown</h3>
             <div className="space-y-3">
               {Object.entries(state.statistics.quadrantFocusTime).map(([key, value]) => (
                 <div key={key} className="flex items-center justify-between text-sm">
                   <span className="capitalize text-gray-600">{key.replace(/_/g, ' ')}</span>
                   <span className="font-mono font-medium">{formatDuration(value)}</span>
                 </div>
               ))}
             </div>
          </div>
        ) : (
          <div className="h-full grid grid-cols-2 grid-rows-2 gap-px bg-gray-200 dark:bg-gray-700">
            <Quadrant
              title="Urgent & Important"
              className="bg-red-50/50 dark:bg-red-900/10"
              tasks={state.tasks.filter(t => t.quadrant === 'urgent_important')}
              quadrant="urgent_important"
              currentTaskId={state.currentTaskId}
              onStartTask={startTask}
              onAddTask={addTask}
              formatDuration={getActiveTaskDuration}
            />
            <Quadrant
              title="Not Urgent & Important"
              className="bg-blue-50/50 dark:bg-blue-900/10"
              tasks={state.tasks.filter(t => t.quadrant === 'important_not_urgent')}
              quadrant="important_not_urgent"
              currentTaskId={state.currentTaskId}
              onStartTask={startTask}
              onAddTask={addTask}
              formatDuration={getActiveTaskDuration}
            />
            <Quadrant
              title="Urgent & Not Important"
              className="bg-yellow-50/50 dark:bg-yellow-900/10"
              tasks={state.tasks.filter(t => t.quadrant === 'urgent_not_important')}
              quadrant="urgent_not_important"
              currentTaskId={state.currentTaskId}
              onStartTask={startTask}
              onAddTask={addTask}
              formatDuration={getActiveTaskDuration}
            />
            <Quadrant
              title="Not Urgent & Not Important"
              className="bg-gray-50/50 dark:bg-gray-900/10"
              tasks={state.tasks.filter(t => t.quadrant === 'not_urgent_not_important')}
              quadrant="not_urgent_not_important"
              currentTaskId={state.currentTaskId}
              onStartTask={startTask}
              onAddTask={addTask}
              formatDuration={getActiveTaskDuration}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-12 bg-white dark:bg-gray-800 border-t flex items-center justify-between px-4 shrink-0">
         <button 
           onClick={state.status === 'resting' ? undefined : startRest}
           disabled={state.status === 'resting'}
           className={clsx(
             "flex-1 mr-2 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center",
             state.status === 'resting' 
               ? "bg-gray-100 text-gray-400 cursor-not-allowed"
               : "bg-green-100 text-green-700 hover:bg-green-200"
           )}
         >
           <Pause size={16} className="mr-1" />
           Rest
         </button>
         <button 
           onClick={stopAll}
           disabled={state.status === 'ended'}
           className={clsx(
             "flex-1 ml-2 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center",
             state.status === 'ended'
               ? "bg-gray-100 text-gray-400 cursor-not-allowed"
               : "bg-red-100 text-red-700 hover:bg-red-200"
           )}
         >
           <Square size={16} className="mr-1" />
           End
         </button>
      </div>
    </div>
  );
};

export default Widget;
