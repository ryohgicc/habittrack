import React, { useState } from 'react';
import { useExtensionState } from '../hooks/useExtensionState';
import { Quadrant } from './Quadrant';
import type { Task } from '../types';
import clsx from 'clsx';
import { Minus, PieChart, Pause, Square, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Settings } from 'lucide-react';

const Widget: React.FC = () => {
  const { state, loading, addTask, deleteTask, editTask, completeTask, startTask, startRest, stopAll, toggleMinimized, setSelectedDate, resetDailyStats, updateAutoStopSettings } = useExtensionState();
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedQuadrants, setExpandedQuadrants] = useState<Record<string, boolean>>({});
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [uiScale, setUiScale] = useState(1);
  
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const toggleQuadrantExpand = (quadrant: string) => {
    setExpandedQuadrants(prev => ({
      ...prev,
      [quadrant]: !prev[quadrant]
    }));
  };

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
  
  React.useEffect(() => {
    const computeScale = () => {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
      if (!rootFontSize || Number.isNaN(rootFontSize)) return 1;

      const probe = document.createElement('div');
      probe.style.position = 'fixed';
      probe.style.left = '-10000px';
      probe.style.top = '-10000px';
      probe.style.width = '100px';
      probe.style.height = '1px';
      probe.style.visibility = 'hidden';
      probe.style.pointerEvents = 'none';
      document.documentElement.appendChild(probe);
      const measured = probe.getBoundingClientRect().width;
      probe.remove();

      const layoutScale = measured && measured > 0 ? measured / 100 : 1;
      return Math.min(1, Math.max(0.1, (16 / rootFontSize) / layoutScale));
    };

    const update = () => setUiScale(computeScale());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  
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
  
  // Settings Logic
  const handleAutoStopToggle = () => {
    updateAutoStopSettings({
       ...state.autoStopSettings,
       enabled: !state.autoStopSettings.enabled
    });
  };

  const handleAutoStopTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAutoStopSettings({
       ...state.autoStopSettings,
       time: e.target.value
    });
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
        className="fixed pointer-events-auto bg-white dark:bg-gray-800 shadow-xl rounded-full px-4 py-2 flex items-center space-x-2 cursor-pointer border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-2xl hover:scale-105 transition-all z-[2147483647]"
        style={{ right: windowState.right, bottom: windowState.bottom, userSelect: 'none', transform: `scale(${uiScale})`, transformOrigin: 'bottom right' }}
        onMouseDown={handleMouseDown}
        onClick={() => {
          if (!windowState.isDragging) toggleMinimized();
        }}
      >
        <div className={clsx("w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-800", state.status === 'in_progress' ? 'bg-green-500' : state.status === 'resting' ? 'bg-blue-500' : 'bg-gray-400')} />
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 drop-shadow-sm">
          {state.status === 'in_progress' ? currentTask?.title : state.status === 'resting' ? '休息中' : '空闲'}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-300 font-mono font-medium">
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
          height: windowState.height,
          transform: `scale(${uiScale})`,
          transformOrigin: 'bottom right'
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
            ) : showSettings ? (
               <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-200 rounded-full">
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
                   {state.status === 'in_progress' ? currentTask?.title : state.status === 'resting' ? '休息一下' : showSettings ? '设置' : '请选择一个任务'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
             {!showStats && !showSettings && (
               <div className="text-lg font-mono font-medium text-blue-600 dark:text-blue-400 mr-2">
                 {state.startTime ? formatDuration(state.savedDuration + (now - state.startTime)) : '00:00'}
               </div>
             )}
             {!showSettings && (
               <button onClick={() => setShowStats(!showStats)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600">
                 <PieChart size={18} />
               </button>
             )}
             {!showStats && (
               <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600">
                 <Settings size={18} />
               </button>
             )}
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
                 
                 // Get completed tasks for the selected date
                 const completedTasks = displayedStats.taskStats 
                    ? Object.values(displayedStats.taskStats).filter((t: any) => t.status === 'completed')
                    : [];

                 return (
                   <>
                     <div className="flex space-x-2 mb-4">
                       <button
                         onClick={() => setShowCompletedTasks(false)}
                         className={clsx(
                           "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                           !showCompletedTasks 
                             ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                             : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                         )}
                       >
                         统计概览
                       </button>
                       <button
                         onClick={() => setShowCompletedTasks(true)}
                         className={clsx(
                           "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                           showCompletedTasks 
                             ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                             : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                         )}
                       >
                         已完成任务 ({completedTasks.length})
                       </button>
                     </div>

                     {showCompletedTasks ? (
                       <div className="space-y-2">
                         {completedTasks.length > 0 ? (
                           completedTasks
                             .sort((a: any, b: any) => b.duration - a.duration)
                             .map((task: any) => (
                               <div key={task.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                 <div className="flex-1 mr-4 overflow-hidden">
                                   <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={task.title}>{task.title}</div>
                                   <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                                      {quadrantNames[task.quadrant] || task.quadrant}
                                   </div>
                                 </div>
                                 <div className="font-mono font-medium text-blue-600 dark:text-blue-400 text-sm">
                                   {formatDuration(task.duration)}
                                 </div>
                               </div>
                             ))
                         ) : (
                           <div className="text-center py-8 text-gray-400 text-sm italic">
                             当天没有已完成的任务
                           </div>
                         )}
                       </div>
                     ) : (
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
                         const isExpanded = expandedQuadrants[key];
                         
                         // Get tasks for this quadrant
                          const tasksInQuadrant = (displayedStats.taskStats 
                            ? Object.values(displayedStats.taskStats)
                            : []
                          ).filter((t: any) => t.quadrant === key);

                          return (
                           <div key={key} className="flex flex-col mb-1">
                              <div 
                                className="flex items-center justify-between text-sm py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 transition-colors select-none"
                                onClick={() => toggleQuadrantExpand(key)}
                              >
                                <div className="flex items-center space-x-2">
                                  {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                  <span className="capitalize text-gray-700 dark:text-gray-300 font-medium">{quadrantNames[key] || key}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-400">({percentage}%)</span>
                                  <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{formatDuration(value)}</span>
                                </div>
                              </div>
                              
                              {/* Task List for Quadrant */}
                              {isExpanded && (
                                <div className="pl-8 pr-2 py-1 space-y-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-md mx-1 border-l-2 border-gray-100 dark:border-gray-700">
                                  {tasksInQuadrant.length > 0 ? (
                                    tasksInQuadrant
                                      .sort((a: any, b: any) => b.duration - a.duration)
                                      .map((task: any) => (
                                        <div key={task.id} className="flex items-center justify-between text-xs group">
                                          <span className="text-gray-600 dark:text-gray-400 truncate mr-2 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors" title={task.title}>{task.title}</span>
                                          <span className="font-mono text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">{formatDuration(task.duration)}</span>
                                        </div>
                                      ))
                                  ) : (
                                    <div className="text-xs text-gray-400 italic py-1">
                                      无专注记录
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                         );
                       })}
                       </div>
                       {(!state.selectedDate || new Date(state.selectedDate).toDateString() === new Date().toDateString()) && (
                         <div className="mt-8 mb-4 border-t pt-4 flex justify-center">
                           <button
                             onClick={() => setShowResetConfirm(true)}
                             className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition-colors flex items-center"
                           >
                             <Square size={12} className="mr-1.5" />
                             重置今日统计数据
                           </button>
                         </div>
                       )}
                       </>
                     )}
                   </>
                 );
               })()}
            </div>
          ) : showSettings ? (
            <div className="absolute inset-0 p-6 overflow-y-auto bg-white dark:bg-gray-900">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">设置</h2>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">自动结束任务</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      防止忘记关闭，每天到达指定时间时自动停止所有任务。
                    </div>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={state.autoStopSettings?.enabled || false}
                        onChange={handleAutoStopToggle}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                {state.autoStopSettings?.enabled && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">自动结束时间</span>
                    <input 
                      type="time" 
                      value={state.autoStopSettings?.time || '23:00'}
                      onChange={handleAutoStopTimeChange}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    />
                  </div>
                )}
              </div>
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
                onEditTask={editTask}
                onCompleteTask={completeTask}
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
                onEditTask={editTask}
                onCompleteTask={completeTask}
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
                onEditTask={editTask}
                onCompleteTask={completeTask}
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
                onEditTask={editTask}
                onCompleteTask={completeTask}
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
      
      {/* Reset Statistics Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[2147483648] flex items-center justify-center bg-black/20 backdrop-blur-sm font-sans pointer-events-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[280px] border border-gray-200 dark:border-gray-700 transition-all" style={{ transform: `scale(${uiScale})`, transformOrigin: 'center' }}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">重置今日数据?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              确定要重置今日的所有统计数据吗？包括任务专注时间和总时长。此操作无法撤销。
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  resetDailyStats();
                  setShowResetConfirm(false);
                }}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[2147483648] flex items-center justify-center bg-black/20 backdrop-blur-sm font-sans pointer-events-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[280px] border border-gray-200 dark:border-gray-700 transition-all" style={{ transform: `scale(${uiScale})`, transformOrigin: 'center' }}>
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
