import React, { useEffect, useRef, useState } from 'react'
import { Check, Edit2, Hourglass, Play, Trash2 } from 'lucide-react'
import type { Task } from '../types'
import type { WidgetTheme } from './widgetStyleTokens'

interface TaskItemProps {
  task: Task
  isActive: boolean
  onStart: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, newTitle: string) => void
  onComplete: (id: string) => void
  formatDuration: (task: Task) => string
  theme: WidgetTheme
}

type ActionKey = 'edit' | 'complete' | 'delete' | null

const buttonReset: React.CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  background: 'transparent',
  border: 'none',
  margin: 0,
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  boxSizing: 'border-box',
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isActive,
  onStart,
  onDelete,
  onEdit,
  onComplete,
  formatDuration,
  theme,
}) => {
  const s = theme.scale
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [activeAction, setActiveAction] = useState<ActionKey>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEditSubmit = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onEdit(task.id, editTitle.trim())
    } else {
      setEditTitle(task.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditSubmit()
    } else if (e.key === 'Escape') {
      setEditTitle(task.title)
      setIsEditing(false)
    }
  }

  const rowBackground = isActive
    ? theme.colors.accentSoft
    : isHovered
      ? theme.colors.panelMuted
      : 'transparent'

  const rowBorder = isActive ? theme.colors.accent : 'transparent'

  const actionButtonStyle = (action: Exclude<ActionKey, null>): React.CSSProperties => {
    const colorMap = {
      edit: theme.colors.accent,
      complete: theme.colors.success,
      delete: theme.colors.danger,
    }

    const backgroundMap = {
      edit: theme.colors.accentSoft,
      complete: theme.colors.successSoft,
      delete: theme.colors.dangerSoft,
    }

    const isActionHovered = activeAction === action

    return {
      ...buttonReset,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: s(24),
      height: s(24),
      borderRadius: theme.radius.sm,
      color: isActionHovered ? colorMap[action] : theme.colors.iconMuted,
      background: isActionHovered ? backgroundMap[action] : 'transparent',
      transition: theme.transition,
      flexShrink: 0,
    }
  }

  if (task.status === 'completed') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: s(6),
          padding: `${s(7)}px ${s(8)}px`,
          borderRadius: theme.radius.md,
          background: theme.colors.panelMuted,
          color: theme.colors.textMuted,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: 8,
            textDecoration: 'line-through',
            fontSize: s(13),
            lineHeight: theme.px(18),
          }}
        >
          {task.title}
        </div>
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: s(11),
            lineHeight: theme.px(16),
            marginRight: 8,
            flexShrink: 0,
          }}
        >
          {formatDuration(task)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            flexShrink: 0,
            color: theme.colors.success,
          }}
        >
          <Check size={s(13)} />
        </div>
      </div>
    )
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setActiveAction(null)
      }}
      onClick={() => {
        if (!isEditing && !isActive) {
          onStart(task.id)
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: s(6),
        padding: `${s(7)}px ${s(8)}px`,
        borderRadius: theme.radius.md,
        transition: theme.transition,
        position: 'relative',
        cursor: isEditing ? 'default' : 'pointer',
        borderLeft: `4px solid ${rowBorder}`,
        background: rowBackground,
        boxSizing: 'border-box',
        minHeight: s(36),
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            marginRight: 8,
            padding: `${s(4)}px ${s(6)}px`,
            borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.inputFocus}`,
            background: theme.colors.input,
            color: theme.colors.textPrimary,
            outline: 'none',
            fontSize: s(13),
            lineHeight: theme.px(18),
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: 8,
            fontWeight: 600,
            fontSize: s(13),
            lineHeight: theme.px(18),
            color: theme.colors.textPrimary,
          }}
        >
          {task.title}
        </div>
      )}

      {!isEditing && !isHovered && (
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: s(11),
            lineHeight: theme.px(16),
            color: theme.colors.textMuted,
            marginRight: 8,
            flexShrink: 0,
          }}
        >
          {formatDuration(task)}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: s(4),
          flexShrink: 0,
        }}
      >
        {isHovered && !isEditing ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setEditTitle(task.title)
                setIsEditing(true)
              }}
              onMouseEnter={() => setActiveAction('edit')}
              onMouseLeave={() => setActiveAction((current) => (current === 'edit' ? null : current))}
              title="修改名称"
              style={actionButtonStyle('edit')}
            >
              <Edit2 size={s(13)} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onComplete(task.id)
              }}
              onMouseEnter={() => setActiveAction('complete')}
              onMouseLeave={() => setActiveAction((current) => (current === 'complete' ? null : current))}
              title="完成任务"
              style={actionButtonStyle('complete')}
            >
              <Check size={s(13)} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
              onMouseEnter={() => setActiveAction('delete')}
              onMouseLeave={() => setActiveAction((current) => (current === 'delete' ? null : current))}
              title="删除任务"
              style={actionButtonStyle('delete')}
            >
              <Trash2 size={s(13)} />
            </button>
          </>
        ) : (
          !isEditing && (
            <div
              style={{
                width: 20,
                display: 'flex',
                justifyContent: 'center',
                color: isActive ? theme.colors.accent : theme.colors.iconMuted,
              }}
            >
              {isActive ? <Hourglass size={s(13)} /> : <Play size={s(13)} />}
            </div>
          )
        )}
      </div>
    </div>
  )
}
