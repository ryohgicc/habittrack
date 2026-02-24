import React, { useState } from 'react';
import type { Task } from '../types';
import clsx from 'clsx';
import { Play, Pause, Trash2 } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
  formatDuration: (task: Task) => string;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isActive, onStart, onDelete, formatDuration }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={() => onStart(task.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        'group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-sm relative',
        isActive
          ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent'
      )}
    >
      <div className="flex-1 truncate mr-2 font-medium text-gray-800 dark:text-gray-200">
        {task.title}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mr-2">
        {formatDuration(task)}
      </div>
      
      <div className="flex items-center w-5 justify-center">
        {isHovered && !isActive ? (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            <Trash2 size={14} />
          </div>
        ) : (
          <div>
             {isActive ? <Pause size={14} className="text-blue-500" /> : <Play size={14} className="text-gray-400 group-hover:text-blue-500" />}
          </div>
        )}
      </div>
    </div>
  );
};
