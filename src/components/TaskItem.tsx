import React, { useState, useRef, useEffect } from 'react';
import type { Task } from '../types';
import clsx from 'clsx';
import { Play, Trash2, Edit2, Check, Hourglass } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
  onComplete: (id: string) => void;
  formatDuration: (task: Task) => string;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isActive, onStart, onDelete, onEdit, onComplete, formatDuration }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditSubmit = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onEdit(task.id, editTitle.trim());
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  if (task.status === 'completed') {
    return (
      <div className="flex items-center justify-between p-2 rounded-md text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex-1 truncate mr-2 line-through">
          {task.title}
        </div>
        <div className="text-xs font-mono mr-2">
          {formatDuration(task)}
        </div>
        <div className="flex items-center w-5 justify-center">
           <Check size={14} />
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!isEditing && !isActive) {
          onStart(task.id);
        } else if (isActive) {
          // If active, clicking anywhere could also mean pausing/stopping, 
          // but usually clicking the item again might not be the standard pause action.
          // The pause button is in the footer or the play icon area.
          // Let's keep it simple: clicking anywhere starts it if not active.
          // If active, maybe we want to pause? The user requirement says "Start that task",
          // implies if it's another task. If it's the same task, it's already started.
        }
      }}
      className={clsx(
        'group flex items-center justify-between p-2 rounded-md transition-colors text-sm relative cursor-pointer',
        isActive
          ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent'
      )}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={handleKeyDown}
          className="flex-1 mr-2 bg-white dark:bg-gray-700 border border-blue-500 rounded px-1 py-0.5 text-sm outline-none cursor-text"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div 
          className="flex-1 truncate mr-2 font-medium text-gray-800 dark:text-gray-200"
        >
          {task.title}
        </div>
      )}
      
      {!isEditing && !isHovered && (
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mr-2">
          {formatDuration(task)}
        </div>
      )}
      
      <div className="flex items-center space-x-1">
        {isHovered && !isEditing ? (
          <>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-gray-400 hover:text-blue-500 transition-colors p-1"
              title="修改名称"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task.id);
              }}
              className="text-gray-400 hover:text-green-500 transition-colors p-1"
              title="完成任务"
            >
              <Check size={14} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="删除任务"
            >
              <Trash2 size={14} />
            </button>
          </>
        ) : (
          !isEditing && (
            <div className="w-5 flex justify-center">
               {isActive ? <Hourglass size={14} className="text-blue-500 animate-spin-slow" /> : <Play size={14} className="text-gray-400 group-hover:text-blue-500" />}
            </div>
          )
        )}
      </div>
    </div>
  );
};
