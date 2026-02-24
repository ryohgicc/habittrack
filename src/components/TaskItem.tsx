import React from 'react';
import type { Task } from '../types';
import clsx from 'clsx';
import { Play, Pause } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onStart: (id: string) => void;
  formatDuration: (task: Task) => string;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isActive, onStart, formatDuration }) => {
  return (
    <div
      onClick={() => onStart(task.id)}
      className={clsx(
        'flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-sm',
        isActive
          ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent'
      )}
    >
      <div className="flex-1 truncate mr-2 font-medium text-gray-800 dark:text-gray-200">
        {task.title}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
        {formatDuration(task)}
      </div>
      <div className="ml-2">
        {isActive ? <Pause size={14} className="text-blue-500" /> : <Play size={14} className="text-gray-400" />}
      </div>
    </div>
  );
};
