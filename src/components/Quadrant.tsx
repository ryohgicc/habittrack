import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import type { QuadrantType, Task } from '../types'
import { TaskItem } from './TaskItem'
import { getQuadrantPalette, type WidgetTheme } from './widgetStyleTokens'

interface QuadrantProps {
  tasks: Task[]
  quadrant: QuadrantType
  currentTaskId: string | null
  onStartTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onEditTask: (taskId: string, newTitle: string) => void
  onCompleteTask: (taskId: string) => void
  onAddTask: (title: string, quadrant: QuadrantType) => void
  formatDuration: (task: Task) => string
  title: string
  theme: WidgetTheme
}

export const Quadrant: React.FC<QuadrantProps> = ({
  tasks,
  quadrant,
  currentTaskId,
  onStartTask,
  onDeleteTask,
  onEditTask,
  onCompleteTask,
  onAddTask,
  formatDuration,
  title,
  theme,
}) => {
  const s = theme.scale
  const [isAdding, setIsAdding] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAddRowHovered, setIsAddRowHovered] = useState(false)

  const palette = getQuadrantPalette(theme, quadrant)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), quadrant)
      setNewTaskTitle('')
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewTaskTitle('')
    }
  }

  const handleBlur = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), quadrant)
      setNewTaskTitle('')
    }
    setIsAdding(false)
  }

  const activeTasks = tasks.filter((task) => task.status !== 'completed')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: `1px solid ${palette.border}`,
        background: palette.background,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${s(8)}px ${s(10)}px`,
        background: palette.headerBackground,
        borderBottom: `1px solid ${palette.border}`,
        fontWeight: 700,
        fontSize: s(10),
        lineHeight: theme.px(14),
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
          boxSizing: 'border-box',
        }}
      >
        <span>{title}</span>
        <span
          style={{
            padding: `${s(2)}px ${s(7)}px`,
            borderRadius: theme.radius.pill,
            background: palette.chipBackground,
            color: palette.chipText,
            fontSize: s(10),
            lineHeight: theme.px(13),
            fontWeight: 700,
          }}
        >
          {activeTasks.length}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: s(6),
          display: 'flex',
          flexDirection: 'column',
          gap: s(4),
          boxSizing: 'border-box',
        }}
      >
        {activeTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isActive={currentTaskId === task.id}
            onStart={onStartTask}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            onComplete={onCompleteTask}
            formatDuration={formatDuration}
            theme={theme}
          />
        ))}
        {activeTasks.length === 0 && !isAdding && (
          <div
            style={{
              textAlign: 'center',
              padding: `${s(14)}px 0`,
              color: theme.colors.textMuted,
              opacity: 0.7,
              fontSize: s(11),
              lineHeight: theme.px(16),
              fontStyle: 'italic',
            }}
          >
            暂无任务
          </div>
        )}
      </div>

      <div
        onClick={() => setIsAdding(true)}
        onMouseEnter={() => setIsAddRowHovered(true)}
        onMouseLeave={() => setIsAddRowHovered(false)}
        style={{
          borderTop: `1px solid ${palette.border}`,
          padding: s(7),
          background: isAdding || isAddRowHovered ? palette.addRowHover : palette.headerBackground,
          cursor: 'text',
          transition: theme.transition,
          boxSizing: 'border-box',
        }}
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
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.colors.textPrimary,
              fontSize: s(13),
              lineHeight: theme.px(18),
              padding: 0,
              margin: 0,
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: s(5),
              color: isAddRowHovered ? palette.accent : theme.colors.textMuted,
              fontSize: s(13),
              lineHeight: theme.px(18),
              transition: theme.transition,
            }}
          >
            <Plus size={s(13)} />
            添加任务
          </div>
        )}
      </div>
    </div>
  )
}
