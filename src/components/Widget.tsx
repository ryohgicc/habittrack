import React, { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Minus,
  Pause,
  PieChart,
  Settings,
  Square,
} from 'lucide-react'
import { useExtensionState } from '../hooks/useExtensionState'
import { Quadrant } from './Quadrant'
import type { DailyTaskStats, QuadrantType, Statistics, Task } from '../types'
import { getWidgetTheme, type WidgetTheme } from './widgetStyleTokens'

const EXPANDED_DEFAULT_SIZE = { width: 400, height: 500 }
const MINIMIZED_CANONICAL_SIZE = { width: 240, height: 44 }
const MIN_EXPANDED_SIZE = { width: 300, height: 400 }
const WINDOW_PADDING = {
  top: 12,
  right: 8,
  bottom: 8,
  left: 12,
}

const buttonResetStyle: React.CSSProperties = {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getDensityScale(width: number, height: number) {
  const widthRatio = width / EXPANDED_DEFAULT_SIZE.width
  const heightRatio = height / EXPANDED_DEFAULT_SIZE.height
  const sizeRatio = Math.min(widthRatio, heightRatio)

  return clamp(0.88 + (sizeRatio - 1) * 0.35, 0.78, 1.04)
}

function clampWindowPosition(
  right: number,
  bottom: number,
  visibleWidth: number,
  visibleHeight: number
) {
  const maxRight = Math.max(
    WINDOW_PADDING.right,
    window.innerWidth - visibleWidth - WINDOW_PADDING.left
  )
  const maxBottom = Math.max(
    WINDOW_PADDING.bottom,
    window.innerHeight - visibleHeight - WINDOW_PADDING.top
  )

  return {
    right: clamp(right, WINDOW_PADDING.right, maxRight),
    bottom: clamp(bottom, WINDOW_PADDING.bottom, maxBottom),
  }
}

function usePrefersDark() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDark(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return isDark
}

interface IconButtonProps {
  theme: WidgetTheme
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  title?: string
  children: React.ReactNode
}

const IconButton: React.FC<IconButtonProps> = ({
  theme,
  onClick,
  disabled = false,
  active = false,
  title,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...buttonResetStyle,
        width: theme.sizes.iconButton,
        height: theme.sizes.iconButton,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.md,
        color: disabled
          ? theme.colors.textDisabled
          : active
            ? theme.colors.accent
            : isHovered
              ? theme.colors.textPrimary
              : theme.colors.icon,
        background: active
          ? theme.colors.accentSoft
          : isHovered
            ? theme.colors.panelSoft
            : 'transparent',
        transition: theme.transition,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

interface ActionButtonProps {
  theme: WidgetTheme
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant: 'success' | 'danger' | 'neutral' | 'primary'
}

const ActionButton: React.FC<ActionButtonProps> = ({
  theme,
  label,
  icon,
  onClick,
  disabled = false,
  variant,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const s = theme.scale

  const variantColors = {
    success: {
      background: theme.colors.successSoft,
      hover: theme.isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.22)',
      text: theme.colors.successText,
    },
    danger: {
      background: theme.colors.dangerSoft,
      hover: theme.isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.22)',
      text: theme.colors.dangerText,
    },
    neutral: {
      background: theme.colors.panelSoft,
      hover: theme.colors.panelMuted,
      text: theme.colors.textSecondary,
    },
    primary: {
      background: theme.colors.accent,
      hover: theme.isDark ? '#3b82f6' : '#1d4ed8',
      text: '#ffffff',
    },
  }[variant]

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...buttonResetStyle,
        flex: 1,
        minWidth: 0,
        height: s(34),
        borderRadius: theme.radius.md,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s(5),
        padding: `0 ${s(10)}px`,
        background: disabled
          ? theme.colors.panelSoft
          : isHovered
            ? variantColors.hover
            : variantColors.background,
        color: disabled ? theme.colors.textDisabled : variantColors.text,
        fontSize: s(13),
        lineHeight: theme.px(18),
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: theme.transition,
        boxSizing: 'border-box',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

interface TabButtonProps {
  theme: WidgetTheme
  active: boolean
  label: string
  onClick: () => void
}

const TabButton: React.FC<TabButtonProps> = ({ theme, active, label, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  const s = theme.scale

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...buttonResetStyle,
        flex: 1,
        height: s(30),
        borderRadius: theme.radius.md,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: s(11),
        lineHeight: theme.px(16),
        fontWeight: 600,
        color: active ? theme.colors.accentText : theme.colors.textSecondary,
        background: active
          ? theme.colors.accentSoft
          : isHovered
            ? theme.colors.panelSoft
            : theme.colors.panelMuted,
        transition: theme.transition,
        boxSizing: 'border-box',
      }}
    >
      {label}
    </button>
  )
}

interface ToggleSwitchProps {
  theme: WidgetTheme
  checked: boolean
  onToggle: () => void
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ theme, checked, onToggle }) => {
  const [isHovered, setIsHovered] = useState(false)
  const s = theme.scale

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...buttonResetStyle,
        position: 'relative',
        width: theme.sizes.switchWidth,
        height: theme.sizes.switchHeight,
        borderRadius: theme.radius.pill,
        background: checked
          ? theme.colors.accent
          : isHovered
            ? theme.colors.borderStrong
            : theme.colors.border,
        transition: theme.transition,
        flexShrink: 0,
      }}
    >
        <span
        style={{
          position: 'absolute',
          top: s(2),
          left: checked ? theme.sizes.switchWidth - s(20) - s(2) : s(2),
          width: s(18),
          height: s(18),
          borderRadius: theme.radius.pill,
          background: '#ffffff',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.18)',
          transition: 'left 160ms ease',
        }}
      />
    </button>
  )
}

interface ResizeHandleProps {
  theme: WidgetTheme
  direction: string
  onMouseDown: (event: React.MouseEvent) => void
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  theme,
  direction,
  onMouseDown,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const s = theme.scale

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 50,
    background: isHovered ? theme.colors.handleHover : 'transparent',
    transition: theme.transition,
  }

  const directionStyle: Record<string, React.CSSProperties> = {
    n: { top: -s(4), left: 0, right: 0, height: s(10), cursor: 'ns-resize' },
    s: { bottom: -s(4), left: 0, right: 0, height: s(10), cursor: 'ns-resize' },
    w: { top: 0, bottom: 0, left: -s(4), width: s(10), cursor: 'ew-resize' },
    e: { top: 0, bottom: 0, right: -s(4), width: s(10), cursor: 'ew-resize' },
    nw: { top: -s(4), left: -s(4), width: s(14), height: s(14), cursor: 'nwse-resize' },
    ne: { top: -s(4), right: -s(4), width: s(14), height: s(14), cursor: 'nesw-resize' },
    sw: { bottom: -s(4), left: -s(4), width: s(14), height: s(14), cursor: 'nesw-resize' },
    se: { bottom: -s(4), right: -s(4), width: s(14), height: s(14), cursor: 'nwse-resize' },
  }

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...baseStyle,
        ...directionStyle[direction],
      }}
    />
  )
}

interface ModalDialogProps {
  theme: WidgetTheme
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  cancelLabel?: string
  onCancel?: () => void
  tone?: 'danger' | 'success' | 'primary'
  width?: number
}

const ModalDialog: React.FC<ModalDialogProps> = ({
  theme,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  tone = 'primary',
  width = 280,
}) => {
  const s = theme.scale
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483648,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.overlay,
        backdropFilter: 'blur(4px)',
        pointerEvents: 'auto',
        fontFamily: theme.fonts.sans,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: s(width),
          borderRadius: theme.radius.lg,
          background: theme.colors.panel,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadow.dialog,
          padding: s(20),
          boxSizing: 'border-box',
        }}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: s(8),
            fontSize: s(17),
            lineHeight: theme.px(24),
            fontWeight: 700,
            color: theme.colors.textPrimary,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            marginBottom: s(20),
            fontSize: s(13),
            lineHeight: theme.px(20),
            color: theme.colors.textSecondary,
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: 'flex',
            gap: s(10),
          }}
        >
          {cancelLabel && onCancel ? (
            <ActionButton
              theme={theme}
              label={cancelLabel}
              onClick={onCancel}
              variant="neutral"
            />
          ) : null}
          <ActionButton
            theme={theme}
            label={confirmLabel}
            onClick={onConfirm}
            variant={tone}
          />
        </div>
      </div>
    </div>
  )
}

const Widget: React.FC = () => {
  const {
    state,
    loading,
    addTask,
    deleteTask,
    editTask,
    completeTask,
    startTask,
    startRest,
    stopAll,
    toggleMinimized,
    setSelectedDate,
    resetDailyStats,
    updateAutoStopSettings,
    updateAutoRestSettings,
    updateTaskStartReminderSettings,
    dismissTaskStartReminder,
    taskStartReminderVisible,
  } = useExtensionState()

  const isDark = usePrefersDark()

  const [showStats, setShowStats] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [expandedQuadrants, setExpandedQuadrants] = useState<Record<string, boolean>>({})
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [taskToComplete, setTaskToComplete] = useState<string | null>(null)
  const [isMinimizedHovered, setIsMinimizedHovered] = useState(false)
  const draggedDuringInteractionRef = React.useRef(false)

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const [windowState, setWindowState] = useState({
    right: 20,
    bottom: 20,
    width: EXPANDED_DEFAULT_SIZE.width,
    height: EXPANDED_DEFAULT_SIZE.height,
    isDragging: false,
    isResizing: false,
    resizeDirection: null as string | null,
    startX: 0,
    startY: 0,
    initialRight: 20,
    initialBottom: 20,
    initialWidth: EXPANDED_DEFAULT_SIZE.width,
    initialHeight: EXPANDED_DEFAULT_SIZE.height,
  })

  const densityScale = useMemo(
    () => getDensityScale(windowState.width, windowState.height),
    [windowState.height, windowState.width]
  )
  const theme = useMemo(
    () => getWidgetTheme(isDark, densityScale),
    [densityScale, isDark]
  )

  const expandedVisibleSize = {
    width: windowState.width,
    height: windowState.height,
  }
  const minimizedVisibleSize = MINIMIZED_CANONICAL_SIZE
  const activeVisibleSize = state.isMinimized ? minimizedVisibleSize : expandedVisibleSize
  const activeWindowPosition = clampWindowPosition(
    windowState.right,
    windowState.bottom,
    activeVisibleSize.width,
    activeVisibleSize.height
  )

  const handleMouseDown = (event: React.MouseEvent) => {
    if (windowState.isResizing) return

    if (
      (event.target as HTMLElement).closest(
        'button, input, select, textarea'
      )
    ) {
      return
    }

    draggedDuringInteractionRef.current = false

    setWindowState((prev) => ({
      ...prev,
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      initialRight: activeWindowPosition.right,
      initialBottom: activeWindowPosition.bottom,
    }))
  }

  const handleResizeStart = (event: React.MouseEvent, direction: string) => {
    event.stopPropagation()
    draggedDuringInteractionRef.current = false

    setWindowState((prev) => ({
      ...prev,
      isResizing: true,
      resizeDirection: direction,
      startX: event.clientX,
      startY: event.clientY,
      initialRight: activeWindowPosition.right,
      initialBottom: activeWindowPosition.bottom,
      initialWidth: prev.width,
      initialHeight: prev.height,
    }))
  }

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (windowState.isDragging) {
        const deltaX = windowState.startX - event.clientX
        const deltaY = windowState.startY - event.clientY

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          draggedDuringInteractionRef.current = true
        }

        const nextPosition = clampWindowPosition(
          windowState.initialRight + deltaX,
          windowState.initialBottom + deltaY,
          activeVisibleSize.width,
          activeVisibleSize.height
        )

        setWindowState((prev) => ({
          ...prev,
          right: nextPosition.right,
          bottom: nextPosition.bottom,
        }))
      } else if (windowState.isResizing) {
        const deltaX = event.clientX - windowState.startX
        const deltaY = event.clientY - windowState.startY

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          draggedDuringInteractionRef.current = true
        }

        setWindowState((prev) => {
          let newWidth = prev.initialWidth
          let newHeight = prev.initialHeight
          let newRight = prev.initialRight
          let newBottom = prev.initialBottom

          if (prev.resizeDirection?.includes('w')) {
            newWidth = prev.initialWidth - deltaX
          } else if (prev.resizeDirection?.includes('e')) {
            newWidth = prev.initialWidth + deltaX
            newRight = prev.initialRight - deltaX
          }

          if (prev.resizeDirection?.includes('n')) {
            newHeight = prev.initialHeight - deltaY
          } else if (prev.resizeDirection?.includes('s')) {
            newHeight = prev.initialHeight + deltaY
            newBottom = prev.initialBottom - deltaY
          }

          if (newWidth < MIN_EXPANDED_SIZE.width) {
            newWidth = MIN_EXPANDED_SIZE.width
            if (prev.resizeDirection?.includes('e')) {
              newRight =
                prev.initialRight - (MIN_EXPANDED_SIZE.width - prev.initialWidth)
            }
          }

          if (newHeight < MIN_EXPANDED_SIZE.height) {
            newHeight = MIN_EXPANDED_SIZE.height
            if (prev.resizeDirection?.includes('s')) {
              newBottom =
                prev.initialBottom - (MIN_EXPANDED_SIZE.height - prev.initialHeight)
            }
          }

          const nextPosition = clampWindowPosition(
            newRight,
            newBottom,
            newWidth,
            newHeight
          )

          return {
            ...prev,
            width: newWidth,
            height: newHeight,
            right: nextPosition.right,
            bottom: nextPosition.bottom,
          }
        })
      }
    }

    const handleMouseUp = () => {
      setWindowState((prev) => ({
        ...prev,
        isDragging: false,
        isResizing: false,
        resizeDirection: null,
      }))
    }

    if (windowState.isDragging || windowState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    activeVisibleSize.height,
    activeVisibleSize.width,
    windowState.initialBottom,
    windowState.initialHeight,
    windowState.initialRight,
    windowState.initialWidth,
    windowState.isDragging,
    windowState.isResizing,
    windowState.resizeDirection,
    windowState.startX,
    windowState.startY,
  ])

  const handleAutoStopToggle = () => {
    updateAutoStopSettings({
      ...state.autoStopSettings,
      enabled: !state.autoStopSettings.enabled,
    })
  }

  const handleAutoStopTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateAutoStopSettings({
      ...state.autoStopSettings,
      time: event.target.value,
    })
  }

  const handleAutoRestToggle = () => {
    updateAutoRestSettings({
      ...state.autoRestSettings,
      enabled: !state.autoRestSettings.enabled,
    })
  }

  const handleAutoRestLunchTimeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateAutoRestSettings({
      ...state.autoRestSettings,
      lunchTime: event.target.value,
    })
  }

  const handleAutoRestNightTimeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateAutoRestSettings({
      ...state.autoRestSettings,
      nightTime: event.target.value,
    })
  }

  const handleTaskStartReminderToggle = () => {
    updateTaskStartReminderSettings({
      ...state.taskStartReminderSettings,
      enabled: !state.taskStartReminderSettings.enabled,
    })
  }

  const handleTaskStartReminderTimeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateTaskStartReminderSettings({
      ...state.taskStartReminderSettings,
      time: event.target.value,
    })
  }

  const toggleQuadrantExpand = (quadrant: string) => {
    setExpandedQuadrants((prev) => ({
      ...prev,
      [quadrant]: !prev[quadrant],
    }))
  }

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  const getActiveTaskDuration = (task: Task) => {
    if (state.status === 'in_progress' && state.currentTaskId === task.id && state.startTime) {
      return formatDuration(task.duration + (now - state.startTime))
    }
    return formatDuration(task.duration)
  }

  const currentTask = state.tasks.find((task) => task.id === state.currentTaskId)

  const quadrantNames: Record<QuadrantType, string> = {
    urgent_important: '紧急且重要',
    important_not_urgent: '重要不紧急',
    urgent_not_important: '紧急不重要',
    not_urgent_not_important: '不重要不紧急',
  }

  const isTodaySelected =
    !state.selectedDate ||
    new Date(state.selectedDate).toDateString() === new Date().toDateString()

  const displayedStats: Statistics = isTodaySelected
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
        taskStats: {},
      }

  const completedTasks = Object.values(
    displayedStats.taskStats || {}
  ).filter((task) => task.status === 'completed') as DailyTaskStats[]

  if (loading) return null

  const s = theme.scale

  const cardStyle: React.CSSProperties = {
    background: theme.colors.panelMuted,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: s(14),
    boxSizing: 'border-box',
  }

  const timeInputStyle: React.CSSProperties = {
    height: s(34),
    padding: `0 ${s(10)}px`,
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.inputBorder}`,
    background: theme.colors.input,
    color: theme.colors.textPrimary,
    fontSize: s(13),
    lineHeight: theme.px(18),
    outline: 'none',
    boxSizing: 'border-box',
  }

  const renderStatsView = () => {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: s(18),
          overflowY: 'auto',
          background: theme.colors.panel,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: s(14),
          }}
        >
          <IconButton
            theme={theme}
            title="上一天"
            onClick={() => {
              const date = new Date(state.selectedDate || new Date())
              date.setDate(date.getDate() - 1)
              setSelectedDate(date.toDateString())
            }}
          >
            <ChevronLeft size={s(16)} />
          </IconButton>

          <h2
            style={{
              margin: 0,
              fontSize: s(16),
              lineHeight: theme.px(24),
              fontWeight: 700,
              color: theme.colors.textPrimary,
            }}
          >
            {isTodaySelected ? '今日统计' : state.selectedDate}
          </h2>

          <IconButton
            theme={theme}
            title="下一天"
            disabled={isTodaySelected}
            onClick={() => {
              const date = new Date(state.selectedDate || new Date())
              date.setDate(date.getDate() + 1)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              if (date <= today) {
                setSelectedDate(date.toDateString())
              }
            }}
          >
            <ChevronRight size={s(16)} />
          </IconButton>
        </div>

        <div
          style={{
            display: 'flex',
            gap: s(6),
            marginBottom: s(14),
          }}
        >
          <TabButton
            theme={theme}
            active={!showCompletedTasks}
            label="统计概览"
            onClick={() => setShowCompletedTasks(false)}
          />
          <TabButton
            theme={theme}
            active={showCompletedTasks}
            label={`已完成任务 (${completedTasks.length})`}
            onClick={() => setShowCompletedTasks(true)}
          />
        </div>

        {showCompletedTasks ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: s(6),
            }}
          >
            {completedTasks.length > 0 ? (
              completedTasks
                .slice()
                .sort((a, b) => b.duration - a.duration)
                .map((task) => (
                  <div
                    key={task.id}
                    style={{
                      ...cardStyle,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        marginRight: s(12),
                      }}
                    >
                      <div
                        title={task.title}
                        style={{
                          fontSize: s(13),
                          lineHeight: theme.px(18),
                          fontWeight: 600,
                          color: theme.colors.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.title}
                      </div>
                      <div
                        style={{
                          marginTop: s(2),
                          fontSize: s(11),
                          lineHeight: theme.px(16),
                          color: theme.colors.textMuted,
                        }}
                      >
                        {quadrantNames[task.quadrant]}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: theme.fonts.mono,
                        fontSize: s(13),
                        lineHeight: theme.px(18),
                        fontWeight: 600,
                        color: theme.colors.accentText,
                        flexShrink: 0,
                      }}
                    >
                      {formatDuration(task.duration)}
                    </div>
                  </div>
                ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: `${s(24)}px 0`,
                  color: theme.colors.textMuted,
                  fontSize: s(13),
                  lineHeight: theme.px(18),
                  fontStyle: 'italic',
                }}
              >
                当天没有已完成的任务
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: s(12),
                marginBottom: s(18),
              }}
            >
              <div
                style={{
                  ...cardStyle,
                  background: theme.colors.accentSoft,
                  borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.2)' : '#bfdbfe',
                }}
              >
              <div
                style={{
                  fontSize: s(11),
                  lineHeight: theme.px(16),
                  color: theme.colors.accentText,
                  textTransform: 'uppercase',
                  marginBottom: s(4),
                }}
              >
                  专注时长
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: s(21),
                    lineHeight: theme.px(28),
                    fontWeight: 700,
                    color: theme.colors.accentText,
                  }}
                >
                  {formatDuration(displayedStats.focusTime)}
                </div>
              </div>
              <div
                style={{
                  ...cardStyle,
                  background: theme.colors.successSoft,
                  borderColor: theme.isDark ? 'rgba(74, 222, 128, 0.22)' : '#bbf7d0',
                }}
              >
              <div
                style={{
                  fontSize: s(11),
                  lineHeight: theme.px(16),
                  color: theme.colors.successText,
                  textTransform: 'uppercase',
                  marginBottom: s(4),
                }}
              >
                  休息时长
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: s(21),
                    lineHeight: theme.px(28),
                    fontWeight: 700,
                    color: theme.colors.successText,
                  }}
                >
                  {formatDuration(displayedStats.restTime)}
                </div>
              </div>
            </div>

            <h3
              style={{
                margin: 0,
                marginBottom: s(10),
                fontSize: s(13),
                lineHeight: theme.px(18),
                fontWeight: 700,
                color: theme.colors.textMuted,
                textTransform: 'uppercase',
              }}
            >
              象限分布
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: s(6),
              }}
            >
              {(
                Object.entries(displayedStats.quadrantFocusTime) as [
                  QuadrantType,
                  number,
                ][]
              ).map(([key, value]) => {
                const totalFocusTime = displayedStats.focusTime
                const percentage = totalFocusTime > 0 ? Math.round((value / totalFocusTime) * 100) : 0
                const isExpanded = !!expandedQuadrants[key]
                const tasksInQuadrant = Object.values(displayedStats.taskStats || {}).filter(
                  (task) => task.quadrant === key
                )

                return (
                  <div
                    key={key}
                    style={{
                      ...cardStyle,
                      padding: s(8),
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleQuadrantExpand(key)}
                      style={{
                        ...buttonResetStyle,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `${s(5)}px ${s(7)}px`,
                        borderRadius: theme.radius.md,
                        color: theme.colors.textSecondary,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: s(6),
                        }}
                      >
                        {isExpanded ? <ChevronUp size={s(13)} /> : <ChevronDown size={s(13)} />}
                        <span
                          style={{
                            fontSize: s(13),
                            lineHeight: theme.px(18),
                            fontWeight: 600,
                          }}
                        >
                          {quadrantNames[key]}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: s(6),
                        }}
                      >
                        <span
                          style={{
                            fontSize: s(11),
                            lineHeight: theme.px(16),
                            color: theme.colors.textMuted,
                          }}
                        >
                          ({percentage}%)
                        </span>
                        <span
                          style={{
                            fontFamily: theme.fonts.mono,
                            fontSize: s(13),
                            lineHeight: theme.px(18),
                            fontWeight: 600,
                          }}
                        >
                          {formatDuration(value)}
                        </span>
                      </div>
                    </button>

                    {isExpanded ? (
                      <div
                        style={{
                          marginTop: s(6),
                          marginLeft: s(6),
                          padding: `${s(8)}px ${s(8)}px ${s(8)}px ${s(12)}px`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: s(6),
                          borderLeft: `2px solid ${theme.colors.border}`,
                          background: theme.colors.panelSoft,
                          borderRadius: theme.radius.sm,
                          boxSizing: 'border-box',
                        }}
                      >
                        {tasksInQuadrant.length > 0 ? (
                          tasksInQuadrant
                            .slice()
                            .sort((a, b) => b.duration - a.duration)
                            .map((task) => (
                              <div
                                key={task.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: s(6),
                                }}
                              >
                                <span
                                  title={task.title}
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: s(11),
                                    lineHeight: theme.px(16),
                                    color: theme.colors.textSecondary,
                                  }}
                                >
                                  {task.title}
                                </span>
                                <span
                                  style={{
                                    flexShrink: 0,
                                    fontFamily: theme.fonts.mono,
                                    fontSize: s(11),
                                    lineHeight: theme.px(16),
                                    color: theme.colors.textMuted,
                                  }}
                                >
                                  {formatDuration(task.duration)}
                                </span>
                              </div>
                            ))
                        ) : (
                          <div
                            style={{
                              fontSize: s(11),
                              lineHeight: theme.px(16),
                              color: theme.colors.textMuted,
                              fontStyle: 'italic',
                            }}
                          >
                            无专注记录
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {isTodaySelected ? (
              <div
                style={{
                  marginTop: s(24),
                  marginBottom: s(12),
                  paddingTop: s(12),
                  borderTop: `1px solid ${theme.colors.border}`,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ActionButton
                  theme={theme}
                  label="重置今日统计数据"
                  icon={<Square size={s(11)} />}
                  onClick={() => setShowResetConfirm(true)}
                  variant="danger"
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    )
  }

  const renderSettingsView = () => {
    const sectionTitleStyle: React.CSSProperties = {
      fontSize: s(13),
      lineHeight: theme.px(18),
      fontWeight: 600,
      color: theme.colors.textPrimary,
    }

    const sectionDescriptionStyle: React.CSSProperties = {
      marginTop: s(4),
      fontSize: s(11),
      lineHeight: theme.px(16),
      color: theme.colors.textMuted,
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: s(18),
          overflowY: 'auto',
          background: theme.colors.panel,
          boxSizing: 'border-box',
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: s(18),
            fontSize: s(16),
            lineHeight: theme.px(24),
            fontWeight: 700,
            color: theme.colors.textPrimary,
          }}
        >
          设置
        </h2>

        <div style={{ ...cardStyle, marginBottom: s(12) }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: s(12),
              marginBottom: state.autoStopSettings.enabled ? s(12) : 0,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={sectionTitleStyle}>自动结束任务</div>
              <div style={sectionDescriptionStyle}>
                防止忘记关闭，每天到达指定时间时自动停止所有任务。
              </div>
            </div>
            <ToggleSwitch
              theme={theme}
              checked={state.autoStopSettings.enabled}
              onToggle={handleAutoStopToggle}
            />
          </div>
          {state.autoStopSettings.enabled ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: s(12),
                paddingTop: s(12),
                borderTop: `1px solid ${theme.colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: s(13),
                  lineHeight: theme.px(18),
                  color: theme.colors.textSecondary,
                }}
              >
                自动结束时间
              </span>
              <input
                type="time"
                value={state.autoStopSettings.time}
                onChange={handleAutoStopTimeChange}
                style={timeInputStyle}
              />
            </div>
          ) : null}
        </div>

        <div style={{ ...cardStyle, marginBottom: s(12) }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: s(12),
              marginBottom: state.autoRestSettings.enabled ? s(12) : 0,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={sectionTitleStyle}>自动休息</div>
              <div style={sectionDescriptionStyle}>
                默认关闭。到午休或晚休时间时，自动终止进行中任务并开始休息计时。
              </div>
            </div>
            <ToggleSwitch
              theme={theme}
              checked={state.autoRestSettings.enabled}
              onToggle={handleAutoRestToggle}
            />
          </div>
          {state.autoRestSettings.enabled ? (
            <div
              style={{
                paddingTop: s(12),
                borderTop: `1px solid ${theme.colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: s(10),
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: s(12),
                }}
              >
                <span
                  style={{
                    fontSize: s(13),
                    lineHeight: theme.px(18),
                    color: theme.colors.textSecondary,
                  }}
                >
                  午休开始时间
                </span>
                <input
                  type="time"
                  value={state.autoRestSettings.lunchTime}
                  onChange={handleAutoRestLunchTimeChange}
                  style={timeInputStyle}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: s(12),
                }}
              >
                <span
                  style={{
                    fontSize: s(13),
                    lineHeight: theme.px(18),
                    color: theme.colors.textSecondary,
                  }}
                >
                  晚休开始时间
                </span>
                <input
                  type="time"
                  value={state.autoRestSettings.nightTime}
                  onChange={handleAutoRestNightTimeChange}
                  style={timeInputStyle}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: s(12),
              marginBottom: state.taskStartReminderSettings.enabled ? s(12) : 0,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={sectionTitleStyle}>定时提醒开始任务</div>
              <div style={sectionDescriptionStyle}>
                默认关闭。到设定时间仍未开始任何任务时，弹出强提醒弹窗。
              </div>
            </div>
            <ToggleSwitch
              theme={theme}
              checked={state.taskStartReminderSettings.enabled}
              onToggle={handleTaskStartReminderToggle}
            />
          </div>
          {state.taskStartReminderSettings.enabled ? (
            <div
              style={{
                paddingTop: s(12),
                borderTop: `1px solid ${theme.colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: s(10),
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: s(12),
                }}
              >
                <span
                  style={{
                    fontSize: s(13),
                    lineHeight: theme.px(18),
                    color: theme.colors.textSecondary,
                  }}
                >
                  提醒时间
                </span>
                <input
                  type="time"
                  value={state.taskStartReminderSettings.time}
                  onChange={handleTaskStartReminderTimeChange}
                  style={timeInputStyle}
                />
              </div>
              <div
                style={{
                  fontSize: s(11),
                  lineHeight: theme.px(16),
                  color: theme.colors.textMuted,
                }}
              >
                到设定时间且当天还没开始任何任务时，只会向当前激活的网页标签投递一次提醒弹窗。
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  const renderQuadrantsView = () => (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
        gap: 1,
        background: theme.colors.border,
        padding: 1,
        boxSizing: 'border-box',
      }}
    >
      <Quadrant
        title={quadrantNames.urgent_important}
        tasks={state.tasks.filter((task) => task.quadrant === 'urgent_important')}
        quadrant="urgent_important"
        currentTaskId={state.currentTaskId}
        onStartTask={startTask}
        onDeleteTask={(taskId) => setTaskToDelete(taskId)}
        onEditTask={editTask}
        onCompleteTask={(taskId) => setTaskToComplete(taskId)}
        onAddTask={addTask}
        formatDuration={getActiveTaskDuration}
        theme={theme}
      />
      <Quadrant
        title={quadrantNames.important_not_urgent}
        tasks={state.tasks.filter((task) => task.quadrant === 'important_not_urgent')}
        quadrant="important_not_urgent"
        currentTaskId={state.currentTaskId}
        onStartTask={startTask}
        onDeleteTask={(taskId) => setTaskToDelete(taskId)}
        onEditTask={editTask}
        onCompleteTask={(taskId) => setTaskToComplete(taskId)}
        onAddTask={addTask}
        formatDuration={getActiveTaskDuration}
        theme={theme}
      />
      <Quadrant
        title={quadrantNames.urgent_not_important}
        tasks={state.tasks.filter((task) => task.quadrant === 'urgent_not_important')}
        quadrant="urgent_not_important"
        currentTaskId={state.currentTaskId}
        onStartTask={startTask}
        onDeleteTask={(taskId) => setTaskToDelete(taskId)}
        onEditTask={editTask}
        onCompleteTask={(taskId) => setTaskToComplete(taskId)}
        onAddTask={addTask}
        formatDuration={getActiveTaskDuration}
        theme={theme}
      />
      <Quadrant
        title={quadrantNames.not_urgent_not_important}
        tasks={state.tasks.filter((task) => task.quadrant === 'not_urgent_not_important')}
        quadrant="not_urgent_not_important"
        currentTaskId={state.currentTaskId}
        onStartTask={startTask}
        onDeleteTask={(taskId) => setTaskToDelete(taskId)}
        onEditTask={editTask}
        onCompleteTask={(taskId) => setTaskToComplete(taskId)}
        onAddTask={addTask}
        formatDuration={getActiveTaskDuration}
        theme={theme}
      />
    </div>
  )

  if (state.isMinimized) {
    return (
      <>
        <div
          onMouseDown={handleMouseDown}
          onClick={() => {
            if (!draggedDuringInteractionRef.current) {
              toggleMinimized()
            }
          }}
          onMouseEnter={() => setIsMinimizedHovered(true)}
          onMouseLeave={() => setIsMinimizedHovered(false)}
          style={{
            position: 'fixed',
            right: activeWindowPosition.right,
            bottom: activeWindowPosition.bottom,
            width: minimizedVisibleSize.width,
            height: minimizedVisibleSize.height,
            userSelect: 'none',
            pointerEvents: 'auto',
            cursor: 'pointer',
            zIndex: 2147483647,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: MINIMIZED_CANONICAL_SIZE.width,
              height: MINIMIZED_CANONICAL_SIZE.height,
              display: 'flex',
              alignItems: 'center',
              gap: s(6),
              padding: `0 ${s(14)}px`,
              borderRadius: theme.radius.pill,
              background: theme.colors.panel,
              border: `2px solid ${
                isMinimizedHovered ? theme.colors.accent : theme.colors.borderStrong
              }`,
              boxShadow: isMinimizedHovered ? theme.shadow.panel : theme.shadow.pill,
              transition: theme.transition,
              overflow: 'hidden',
              fontFamily: theme.fonts.sans,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: s(8),
                height: s(8),
                borderRadius: theme.radius.pill,
                background:
                  state.status === 'in_progress'
                    ? theme.colors.success
                    : state.status === 'resting'
                      ? theme.colors.accent
                      : theme.colors.textDisabled,
                boxShadow: `0 0 0 2px ${theme.colors.panel}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: s(13),
                lineHeight: theme.px(18),
                fontWeight: 700,
                color: theme.colors.textPrimary,
              }}
            >
              {state.status === 'in_progress'
                ? currentTask?.title
                : state.status === 'resting'
                  ? '休息中'
                  : '空闲'}
            </span>
            <span
              style={{
                flexShrink: 0,
                fontFamily: theme.fonts.mono,
                fontSize: s(11),
                lineHeight: theme.px(16),
                fontWeight: 600,
                color: theme.colors.textSecondary,
              }}
            >
              {state.startTime
                ? formatDuration(state.savedDuration + (now - state.startTime))
                : formatDuration(0)}
            </span>
          </div>
        </div>

        {showResetConfirm ? (
          <ModalDialog
            theme={theme}
            title="重置今日数据?"
            description="确定要重置今日的所有统计数据吗？包括任务专注时间和总时长。此操作无法撤销。"
            confirmLabel="重置"
            cancelLabel="取消"
            tone="danger"
            onConfirm={() => {
              resetDailyStats()
              setShowResetConfirm(false)
            }}
            onCancel={() => setShowResetConfirm(false)}
          />
        ) : null}
      </>
    )
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: activeWindowPosition.right,
          bottom: activeWindowPosition.bottom,
          width: expandedVisibleSize.width,
          height: expandedVisibleSize.height,
          pointerEvents: 'auto',
          zIndex: 2147483647,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: windowState.width,
            height: windowState.height,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: theme.fonts.sans,
            boxSizing: 'border-box',
          }}
        >
          {['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se'].map((direction) => (
            <ResizeHandle
              key={direction}
              theme={theme}
              direction={direction}
              onMouseDown={(event) => handleResizeStart(event, direction)}
            />
          ))}

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: theme.colors.panel,
              borderRadius: theme.radius.xl,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadow.panel,
              overflow: 'hidden',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            <div
              onMouseDown={handleMouseDown}
              style={{
                height: theme.sizes.header,
                padding: `0 ${s(14)}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: s(10),
                background: theme.colors.panelMuted,
                borderBottom: `1px solid ${theme.colors.border}`,
                cursor: 'move',
                userSelect: 'none',
                position: 'relative',
                zIndex: 40,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: s(6),
                  overflow: 'hidden',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {showStats ? (
                  <IconButton
                    theme={theme}
                    title="返回"
                    onClick={() => setShowStats(false)}
                  >
                    <ChevronLeft size={s(16)} />
                  </IconButton>
                ) : showSettings ? (
                  <IconButton
                    theme={theme}
                    title="返回"
                    onClick={() => setShowSettings(false)}
                  >
                    <ChevronLeft size={s(16)} />
                  </IconButton>
                ) : null}

                {showStats || showSettings ? null : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: s(11),
                        lineHeight: theme.px(16),
                        color: theme.colors.textMuted,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {state.status === 'in_progress' ? (
                        <>
                          <span>专注中</span>
                          {currentTask ? (
                            <span
                              style={{
                                marginLeft: 4,
                                fontSize: s(10),
                                lineHeight: theme.px(13),
                                fontWeight: 400,
                                opacity: 0.8,
                              }}
                            >
                              - {quadrantNames[currentTask.quadrant]}
                            </span>
                          ) : null}
                        </>
                      ) : state.status === 'resting' ? (
                        '休息中'
                      ) : (
                        '准备就绪'
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: s(13),
                        lineHeight: theme.px(18),
                        fontWeight: 600,
                        color: theme.colors.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {state.status === 'in_progress'
                        ? currentTask?.title
                        : state.status === 'resting'
                          ? '休息一下'
                          : showSettings
                            ? '设置'
                            : '请选择一个任务'}
                    </span>
                  </div>
                )}

                {showStats ? (
                  <div
                    style={{
                      fontSize: s(17),
                      lineHeight: theme.px(24),
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    统计
                  </div>
                ) : null}

                {showSettings ? (
                  <div
                    style={{
                      fontSize: s(17),
                      lineHeight: theme.px(24),
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    设置
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: s(6),
                  flexShrink: 0,
                }}
              >
                {!showStats && !showSettings ? (
                  <div
                    style={{
                      marginRight: s(6),
                      fontFamily: theme.fonts.mono,
                      fontSize: s(17),
                      lineHeight: theme.px(24),
                      fontWeight: 600,
                      color: theme.colors.accentText,
                    }}
                  >
                    {state.startTime
                      ? formatDuration(state.savedDuration + (now - state.startTime))
                      : '00:00'}
                  </div>
                ) : null}

                {!showSettings ? (
                  <IconButton
                    theme={theme}
                    title="统计"
                    active={showStats}
                    onClick={() => setShowStats((prev) => !prev)}
                  >
                    <PieChart size={s(16)} />
                  </IconButton>
                ) : null}

                {!showStats ? (
                  <IconButton
                    theme={theme}
                    title="设置"
                    active={showSettings}
                    onClick={() => setShowSettings((prev) => !prev)}
                  >
                    <Settings size={s(16)} />
                  </IconButton>
                ) : null}

                <IconButton
                  theme={theme}
                  title="最小化"
                  onClick={toggleMinimized}
                >
                  <Minus size={s(16)} />
                </IconButton>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {showStats
                ? renderStatsView()
                : showSettings
                  ? renderSettingsView()
                  : renderQuadrantsView()}
            </div>

            <div
              onMouseDown={handleMouseDown}
              style={{
                height: theme.sizes.footer,
                padding: `0 ${s(14)}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: s(10),
                background: theme.colors.panel,
                borderTop: `1px solid ${theme.colors.border}`,
                cursor: 'move',
                boxSizing: 'border-box',
              }}
            >
              <ActionButton
                theme={theme}
                label="休息"
                icon={<Pause size={s(14)} />}
                onClick={state.status === 'resting' ? undefined : startRest}
                disabled={state.status === 'resting'}
                variant="success"
              />
              <ActionButton
                theme={theme}
                label="结束"
                icon={<Square size={s(14)} />}
                onClick={stopAll}
                disabled={state.status === 'ended'}
                variant="danger"
              />
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm ? (
        <ModalDialog
          theme={theme}
          title="重置今日数据?"
          description="确定要重置今日的所有统计数据吗？包括任务专注时间和总时长。此操作无法撤销。"
          confirmLabel="重置"
          cancelLabel="取消"
          tone="danger"
          onConfirm={() => {
            resetDailyStats()
            setShowResetConfirm(false)
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      ) : null}

      {taskToDelete ? (
        <ModalDialog
          theme={theme}
          title="确认删除?"
          description="确定要删除这个任务吗？此操作无法撤销。"
          confirmLabel="删除"
          cancelLabel="取消"
          tone="danger"
          onConfirm={() => {
            deleteTask(taskToDelete)
            setTaskToDelete(null)
          }}
          onCancel={() => setTaskToDelete(null)}
        />
      ) : null}

      {taskToComplete ? (
        <ModalDialog
          theme={theme}
          title="确认完成?"
          description="确定要将这个任务标记为已完成吗？"
          confirmLabel="确认"
          cancelLabel="取消"
          tone="success"
          onConfirm={() => {
            completeTask(taskToComplete)
            setTaskToComplete(null)
          }}
          onCancel={() => setTaskToComplete(null)}
        />
      ) : null}

      {taskStartReminderVisible ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483649,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.colors.overlayStrong,
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto',
            fontFamily: theme.fonts.sans,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: s(300),
              borderRadius: theme.radius.lg,
              background: theme.colors.panel,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadow.dialog,
              padding: s(20),
              boxSizing: 'border-box',
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: s(8),
                fontSize: s(17),
                lineHeight: theme.px(24),
                fontWeight: 700,
                color: theme.colors.textPrimary,
              }}
            >
              该开始任务啦
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: s(18),
                fontSize: s(13),
                lineHeight: theme.px(20),
                color: theme.colors.textSecondary,
              }}
            >
              你设置的提醒时间已到，但今天还没有开始任何任务。现在就开始第一项任务吧。
            </p>
            <ActionButton
              theme={theme}
              label="我知道了"
              onClick={dismissTaskStartReminder}
              variant="primary"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Widget
