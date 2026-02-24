import React, { useState } from 'react';
import type { Task, QuadrantType } from '../types';
import { TaskItem } from './TaskItem';
import clsx from 'clsx';
import { Plus } from 'lucide-react';

interface QuadrantProps {
  tasks: Task[];
  quadrant: QuadrantType;
  currentTaskId: string | null;
  onStartTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (title: string, quadrant: QuadrantType) => void;
  formatDuration: (task: Task) => string;
  className?: string;
  title: string;
}

export const Quadrant: React.FC<QuadrantProps> = ({
  tasks,
  quadrant,
  currentTaskId,
  onStartTask,
  onDeleteTask,
  onAddTask,
  formatDuration,
  className,
  title,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), quadrant);
      setNewTaskTitle('');
      // Keep focus
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTaskTitle('');
    }
  };

  const handleBlur = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), quadrant);
      setNewTaskTitle('');
    }
    setIsAdding(false);
  };

  return (
    <div className={clsx('flex flex-col h-full border rounded-lg overflow-hidden', className)}>
      <div className="px-3 py-2 bg-white/50 dark:bg-gray-800/50 border-b font-semibold text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider flex justify-between items-center">
        {title}
        <span className="bg-white/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-[10px]">
          {tasks.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isActive={currentTaskId === task.id}
            onStart={onStartTask}
            onDelete={onDeleteTask}
            formatDuration={formatDuration}
          />
        ))}
        {tasks.length === 0 && !isAdding && (
          <div className="text-center py-4 text-gray-500/50 text-xs italic">
            暂无任务
          </div>
        )}
      </div>

      {/* Frozen Add Row */}
      <div 
        className="border-t p-2 bg-white/50 dark:bg-gray-800/50 cursor-text hover:bg-white/80 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setIsAdding(true)}
      >
        {isAdding ? (
          <input
            autoFocus
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="输入任务并回车..."
            className="w-full text-sm bg-transparent border-none outline-none placeholder-gray-400 text-gray-800 dark:text-gray-200"
          />
        ) : (
          <div className="flex items-center text-sm text-gray-500 hover:text-blue-600">
            <Plus size={14} className="mr-1" />
            添加任务
          </div>
        )}
      </div>
    </div>
  );
};
