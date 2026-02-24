import React, { useState } from 'react';
import { useExtensionState } from '../hooks/useExtensionState';
import { Quadrant } from './Quadrant';
import type { Task } from '../types';
import clsx from 'clsx';
import { Minus, PieChart, Pause, Square, ChevronLeft } from 'lucide-react';

const Widget: React.FC = () => {
  const { state, loading, addTask, deleteTask, startTask, startRest, stopAll, toggleMinimized } = useExtensionState();
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

  // Dragging logic
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialRight: 20,
    initialBottom: 20,
    currentRight: 20,
    currentBottom: 20,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialRight: prev.currentRight,
      initialBottom: prev.currentBottom,
    }));
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        const deltaX = dragState.startX - e.clientX; // Moving left increases right value
        const deltaY = dragState.startY - e.clientY; // Moving up increases bottom value
        setDragState(prev => ({
          ...prev,
          currentRight: prev.initialRight + deltaX,
          currentBottom: prev.initialBottom + deltaY,
        }));
      }
    };

    const handleMouseUp = () => {
      setDragState(prev => ({ ...prev, isDragging: false }));
    };

    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, dragState.startX, dragState.startY, dragState.initialRight, dragState.initialBottom]);

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
        className="fixed bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center space-x-2 cursor-pointer border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform z-[2147483647]"
        style={{ right: dragState.currentRight, bottom: dragState.currentBottom, userSelect: 'none' }}
        onMouseDown={handleMouseDown}
        onClick={() => {
          if (!dragState.isDragging) toggleMinimized();
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
        className="fixed w-[400px] h-[500px] bg-white dark:bg-gray-900 shadow-2xl rounded-xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden z-[2147483647] font-sans"
        style={{ right: dragState.currentRight, bottom: dragState.currentBottom }}
      >
        {/* Header */}
        <div 
          className="h-14 bg-gray-50 dark:bg-gray-800 border-b flex items-center justify-between px-4 shrink-0 cursor-move select-none"
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
               <h2 className="text-lg font-bold mb-4">今日统计</h2>
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-blue-50 p-4 rounded-lg">
                   <div className="text-xs text-blue-500 uppercase mb-1">专注时长</div>
                   <div className="text-2xl font-mono font-bold text-blue-700">{formatDuration(state.statistics.focusTime)}</div>
                 </div>
                 <div className="bg-green-50 p-4 rounded-lg">
                   <div className="text-xs text-green-500 uppercase mb-1">休息时长</div>
                   <div className="text-2xl font-mono font-bold text-green-700">{formatDuration(state.statistics.restTime)}</div>
                 </div>
               </div>
               <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase">象限分布</h3>
               <div className="space-y-3">
                 {Object.entries(state.statistics.quadrantFocusTime).map(([key, value]) => {
                   const quadrantNames: Record<string, string> = {
                      urgent_important: '紧急且重要',
                      important_not_urgent: '重要不紧急',
                      urgent_not_important: '紧急不重要',
                      not_urgent_not_important: '不重要不紧急'
                   };
                   const totalFocusTime = state.statistics.focusTime;
                   const percentage = totalFocusTime > 0 ? Math.round((value / totalFocusTime) * 100) : 0;
                   
                   return (
                     <div key={key} className="flex items-center justify-between text-sm">
                       <span className="capitalize text-gray-600">{quadrantNames[key] || key}</span>
                       <div className="flex items-center space-x-2">
                         <span className="text-xs text-gray-400">({percentage}%)</span>
                         <span className="font-mono font-medium">{formatDuration(value)}</span>
                       </div>
                     </div>
                   );
                 })}
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
      
      {/* Delete Confirmation Dialog */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[2147483648] flex items-center justify-center bg-black/20 backdrop-blur-sm font-sans">
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
