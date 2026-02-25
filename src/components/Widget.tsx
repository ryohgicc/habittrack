import React, { useState } from 'react';
import { useExtensionState } from '../hooks/useExtensionState';
import { Quadrant } from './Quadrant';
import type { Task } from '../types';
import clsx from 'clsx';
import { Minus, PieChart, Pause, Square, ChevronLeft, ChevronRight } from 'lucide-react';

const Widget: React.FC = () => {
  const { state, loading, addTask, deleteTask, startTask, startRest, stopAll, toggleMinimized, setSelectedDate } = useExtensionState();
  const [showStats, setShowStats] = useState(false);
  
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const confirmDelete = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const cancelDelete = () => {
    setTaskToDelete(null);
  };

  const executeDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };
  

  
  // We need a global "now" to update all active timers in sync
  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Dragging & Resizing logic
  const [windowState, setWindowState] = useState({
    // Position
    right: 20,
    bottom: 20,
    // Size
    width: 400,
    height: 500,
    // Interaction state
    isDragging: false,
    isResizing: false,
    resizeDirection: null as string | null,
    startX: 0,
    startY: 0,
    initialRight: 20,
    initialBottom: 20,
    initialWidth: 400,
    initialHeight: 500,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if not resizing and not clicking on interactive elements
    if (windowState.isResizing) return;
    
    // Check if click target is interactive (button, etc)
    if ((e.target as HTMLElement).closest('button')) return;

    setWindowState(prev => ({
      ...prev,
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialRight: prev.right,
      initialBottom: prev.bottom,
    }));
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation(); // Prevent drag start
    setWindowState(prev => ({
      ...prev,
      isResizing: true,
      resizeDirection: direction,
      startX: e.clientX,
      startY: e.clientY,
      initialRight: prev.right,
      initialBottom: prev.bottom,
      initialWidth: prev.width,
      initialHeight: prev.height,
    }));
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (windowState.isDragging) {
        const deltaX = windowState.startX - e.clientX; // Moving left increases right value
        const deltaY = windowState.startY - e.clientY; // Moving up increases bottom value
        setWindowState(prev => ({
          ...prev,
          right: prev.initialRight + deltaX,
          bottom: prev.initialBottom + deltaY,
        }));
      } else if (windowState.isResizing) {
        const deltaX = e.clientX - windowState.startX;
        const deltaY = e.clientY - windowState.startY;
        
        setWindowState(prev => {
          let newWidth = prev.initialWidth;
          let newHeight = prev.initialHeight;
          let newRight = prev.initialRight;
          let newBottom = prev.initialBottom;

          // Horizontal resizing
          if (prev.resizeDirection?.includes('w')) {
            // Left edge: dragging left (negative deltaX) increases width
            newWidth = prev.initialWidth - deltaX;
            // Right position doesn't change
          } else if (prev.resizeDirection?.includes('e')) {
            // Right edge: dragging right (positive deltaX) increases width
            // But since we are positioned by 'right', increasing width while keeping 'right' fixed
            // would expand to the left. We want to expand to the right.
            // So we must DECREASE 'right' by the same amount we INCREASE 'width'.
            newWidth = prev.initialWidth + deltaX;
            newRight = prev.initialRight - deltaX;
          }

          // Vertical resizing
          if (prev.resizeDirection?.includes('n')) {
            // Top edge: dragging up (negative deltaY) increases height
            newHeight = prev.initialHeight - deltaY;
            // Bottom position doesn't change
          } else if (prev.resizeDirection?.includes('s')) {
            // Bottom edge: dragging down (positive deltaY) increases height
            // Similar to right edge, we must DECREASE 'bottom'.
            newHeight = prev.initialHeight + deltaY;
            newBottom = prev.initialBottom - deltaY;
          }

          // Min constraints
          if (newWidth < 300) {
            newWidth = 300;
             // If we were adjusting 'right', we need to recalculate it based on the constrained width
             if (prev.resizeDirection?.includes('e')) {
                newRight = prev.initialRight - (300 - prev.initialWidth);
             }
          }
          if (newHeight < 400) {
            newHeight = 400;
             if (prev.resizeDirection?.includes('s')) {
                newBottom = prev.initialBottom - (400 - prev.initialHeight);
             }
          }

          return {
            ...prev,
            width: newWidth,
            height: newHeight,
            right: newRight,
            bottom: newBottom,
          };
        });
      }
    };

    const handleMouseUp = () => {
      setWindowState(prev => ({ ...prev, isDragging: false, isResizing: false, resizeDirection: null }));
    };

    if (windowState.isDragging || windowState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [windowState.isDragging, windowState.isResizing, windowState.startX, windowState.startY, windowState.initialRight, windowState.initialBottom, windowState.initialWidth, windowState.initialHeight, windowState.resizeDirection]);

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

  const getActiveTaskDuration = (task: Task) => {
    if (state.status === 'in_progress' && state.currentTaskId === task.id && state.startTime) {
      return formatDuration(task.duration + (now - state.startTime));
    }
    return formatDuration(task.duration);
  };

  const currentTask = state.tasks.find(t => t.id === state.currentTaskId);

  const quadrantNames: Record<string, string> = {
    urgent_important: '紧急且重要',
    important_not_urgent: '重要不紧急',
    urgent_not_important: '紧急不重要',
    not_urgent_not_important: '不重要不紧急'
  };
  
  if (loading) return null;

  if (state.isMinimized) {
    return (
      <div 
        className="fixed pointer-events-auto bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center space-x-2 cursor-pointer border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform z-[2147483647]"
        style={{ right: windowState.right, bottom: windowState.bottom, userSelect: 'none' }}
        onMouseDown={handleMouseDown}
        onClick={() => {
          if (!windowState.isDragging) toggleMinimized();
        }}
      >
        <div className={clsx("w-2 h-2 rounded-full", state.status === 'in_progress' ? 'bg-green-500' : state.status === 'resting' ? 'bg-blue-500' : 'bg-gray-400')} />
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {state.status === 'in_progress' ? currentTask?.title : state.status === 'resting' ? '休息中' : '空闲'}
        </span>
        <span className="text-xs text-gray-500 font-mono">
          {state.startTime ? formatDuration(state.savedDuration + (now - state.startTime)) : formatDuration(0)}
        </span>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed z-[2147483647] font-sans pointer-events-auto flex flex-col"
        style={{ 
          right: windowState.right, 
          bottom: windowState.bottom,
          width: windowState.width,
          height: windowState.height
        }}
      >
        {/* Resize Handles */}
        <div className="absolute -top-1 left-0 w-full h-3 cursor-ns-resize z-50 hover:bg-blue-500/10" onMouseDown={(e) => handleResizeStart(e, 'n')} />
        <div className="absolute -bottom-1 left-0 w-full h-3 cursor-ns-resize z-50 hover:bg-blue-500/10" onMouseDown={(e) => handleResizeStart(e, 's')} />
        <div className="absolute top-0 -left-1 h-full w-3 cursor-ew-resize z-50 hover:bg-blue-500/10" onMouseDown={(e) => handleResizeStart(e, 'w')} />
        <div className="absolute top-0 -right-1 h-full w-3 cursor-ew-resize z-50 hover:bg-blue-500/10" onMouseDown={(e) => handleResizeStart(e, 'e')} />
        
        {/* Corner Handles */}
        <div className="absolute -top-1 -left-1 w-5 h-5 cursor-nwse-resize z-50 hover:bg-blue-500/20" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
        <div className="absolute -top-1 -right-1 w-5 h-5 cursor-nesw-resize z-50 hover:bg-blue-500/20" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
        <div className="absolute -bottom-1 -left-1 w-5 h-5 cursor-nesw-resize z-50 hover:bg-blue-500/20" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 cursor-nwse-resize z-50 hover:bg-blue-500/20" onMouseDown={(e) => handleResizeStart(e, 'se')} />

        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        {/* Header */}
        <div 
          className="h-14 bg-gray-50 dark:bg-gray-800 border-b flex items-center justify-between px-4 shrink-0 cursor-move select-none relative z-40"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            {showStats ? (
               <button onClick={() => setShowStats(false)} className="p-1 hover:bg-gray-200 rounded-full">
                 <ChevronLeft size={18} />
               </button>
            ) : (
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                  {state.status === 'in_progress' ? (
                    <>
                      <span>专注中</span>
                      {currentTask && (
                        <span className="ml-1 text-[10px] font-normal opacity-75">
                           - {quadrantNames[currentTask.quadrant]}
                        </span>
                      )}
                    </>
                  ) : state.status === 'resting' ? '休息中' : '准备就绪'}
                </span>
                <span className="text-sm font-semibold truncate text-gray-800 dark:text-gray-100">
                   {state.status === 'in_progress' ? currentTask?.title : state.status === 'resting' ? '休息一下' : '请选择一个任务'}
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
               <div className="flex items-center justify-between mb-4">
                 <button 
                   onClick={() => {
                     const date = new Date(state.selectedDate || new Date());
                     date.setDate(date.getDate() - 1);
                     setSelectedDate(date.toDateString());
                   }}
                   className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                 >
                   <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                 </button>
                 <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                   {(!state.selectedDate || new Date(state.selectedDate).toDateString() === new Date().toDateString()) 
                     ? '今日统计' 
                     : state.selectedDate}
                 </h2>
                 <button 
                   onClick={() => {
                     const date = new Date(state.selectedDate || new Date());
                     date.setDate(date.getDate() + 1);
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     if (date <= today) {
                        setSelectedDate(date.toDateString());
                     }
                   }}
                   disabled={!state.selectedDate || new Date(state.selectedDate).toDateString() === new Date().toDateString()}
                   className={clsx(
                     "p-1 rounded transition-colors", 
                     (!state.selectedDate || new Date(state.selectedDate).toDateString() === new Date().toDateString())
                       ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" 
                       : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                   )}
                 >
                   <ChevronRight size={20} />
                 </button>
               </div>

               {(() => {
                 const displayedStats = (!state.selectedDate || new Date(state.selectedDate).toDateString() === new Date().toDateString())
                    ? state.statistics
                    : state.history?.[state.selectedDate] || {
                        focusTime: 0,
                        restTime: 0,
                        quadrantFocusTime: {
                          urgent_important: 0,
                          important_not_urgent: 0,
                          urgent_not_important: 0,
                          not_urgent_not_important: 0,
                        },
                      };
                 
                 return (
                   <>
                     <div className="grid grid-cols-2 gap-4 mb-6">
                       <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                         <div className="text-xs text-blue-500 uppercase mb-1">专注时长</div>
                         <div className="text-2xl font-mono font-bold text-blue-700 dark:text-blue-400">{formatDuration(displayedStats.focusTime)}</div>
                       </div>
                       <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                         <div className="text-xs text-green-500 uppercase mb-1">休息时长</div>
                         <div className="text-2xl font-mono font-bold text-green-700 dark:text-green-400">{formatDuration(displayedStats.restTime)}</div>
                       </div>
                     </div>
                     <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase">象限分布</h3>
                     <div className="space-y-3">
                       {Object.entries(displayedStats.quadrantFocusTime).map(([key, value]) => {
                         const quadrantNames: Record<string, string> = {
                            urgent_important: '紧急且重要',
                            important_not_urgent: '重要不紧急',
                            urgent_not_important: '紧急不重要',
                            not_urgent_not_important: '不重要不紧急'
                         };
                         const totalFocusTime = displayedStats.focusTime;
                         const percentage = totalFocusTime > 0 ? Math.round((value / totalFocusTime) * 100) : 0;
                         
                         return (
                           <div key={key} className="flex items-center justify-between text-sm">
                             <span className="capitalize text-gray-600 dark:text-gray-400">{quadrantNames[key] || key}</span>
                             <div className="flex items-center space-x-2">
                               <span className="text-xs text-gray-400">({percentage}%)</span>
                               <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{formatDuration(value)}</span>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </>
                 );
               })()}
            </div>
          ) : (
            <div className="h-full grid grid-cols-2 grid-rows-2 gap-px bg-gray-200 dark:bg-gray-700">
              <Quadrant
                title={quadrantNames.urgent_important}
                className="!bg-red-50 dark:!bg-red-900/20"
                tasks={state.tasks.filter(t => t.quadrant === 'urgent_important')}
                quadrant="urgent_important"
                currentTaskId={state.currentTaskId}
                onStartTask={startTask}
                onDeleteTask={confirmDelete}
                onAddTask={addTask}
                formatDuration={getActiveTaskDuration}
              />
              <Quadrant
                title={quadrantNames.important_not_urgent}
                className="!bg-blue-50 dark:!bg-blue-900/20"
                tasks={state.tasks.filter(t => t.quadrant === 'important_not_urgent')}
                quadrant="important_not_urgent"
                currentTaskId={state.currentTaskId}
                onStartTask={startTask}
                onDeleteTask={confirmDelete}
                onAddTask={addTask}
                formatDuration={getActiveTaskDuration}
              />
              <Quadrant
                title={quadrantNames.urgent_not_important}
                className="!bg-yellow-50 dark:!bg-yellow-900/20"
                tasks={state.tasks.filter(t => t.quadrant === 'urgent_not_important')}
                quadrant="urgent_not_important"
                currentTaskId={state.currentTaskId}
                onStartTask={startTask}
                onDeleteTask={confirmDelete}
                onAddTask={addTask}
                formatDuration={getActiveTaskDuration}
              />
              <Quadrant
                title={quadrantNames.not_urgent_not_important}
                className="!bg-gray-50 dark:!bg-gray-900/20"
                tasks={state.tasks.filter(t => t.quadrant === 'not_urgent_not_important')}
                quadrant="not_urgent_not_important"
                currentTaskId={state.currentTaskId}
                onStartTask={startTask}
                onDeleteTask={confirmDelete}
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
             休息
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
             结束
           </button>
        </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[2147483648] flex items-center justify-center bg-black/20 backdrop-blur-sm font-sans pointer-events-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[280px] border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">确认删除?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              确定要删除这个任务吗？此操作无法撤销。
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={cancelDelete}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Widget;
