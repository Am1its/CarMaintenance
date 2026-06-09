import { useState } from 'react'
import { addCarTask, toggleCarTask, deleteCarTask, updateCar } from '../api'

type Task = {
  id: string
  text: string
  isDone: boolean
  createdAt: string
}

type Props = {
  car: { id: string; label: string; notes: string | null }
  token: string
  initialTasks: Task[]
  onClose: () => void
}

export default function CarTasksModal({ car, token, initialTasks, onClose }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [notes, setNotes] = useState(car.notes ?? '')
  const [notesDirty, setNotesDirty] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')

  const activeTasks = tasks.filter(t => !t.isDone)
  const doneTasks = tasks.filter(t => t.isDone)

  const handleAddTask = async () => {
    const text = newTaskText.trim()
    if (!text) return
    const task = await addCarTask(token, car.id, text)
    setTasks(ts => [...ts, task])
    setNewTaskText('')
  }

  const handleToggle = async (task: Task) => {
    await toggleCarTask(token, car.id, task.id, !task.isDone)
    setTasks(ts => ts.map(t => t.id === task.id ? { ...t, isDone: !t.isDone } : t))
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteCarTask(token, car.id, taskId)
    setTasks(ts => ts.filter(t => t.id !== taskId))
  }

  const handleSaveNotes = async () => {
    await updateCar(token, car.id, { notes: notes || null })
    setNotesDirty(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="text-gray-400 text-lg leading-none p-1">✕</button>
          <h2 className="font-bold text-base">{car.label}</h2>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {/* Notes */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">📝 פתקים</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-blue-400"
              rows={3}
              placeholder="הוסף פתקים על הרכב..."
              value={notes}
              onChange={e => { setNotes(e.target.value); setNotesDirty(true) }}
            />
            {notesDirty && (
              <button
                onClick={handleSaveNotes}
                className="mt-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium"
              >
                שמור
              </button>
            )}
          </div>

          {/* Tasks */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">✅ משימות</p>

            {/* Add task */}
            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-right outline-none focus:border-blue-400"
                placeholder="משימה חדשה..."
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              />
              <button
                onClick={handleAddTask}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl font-medium flex-shrink-0"
              >
                הוסף
              </button>
            </div>

            {/* Active tasks */}
            {activeTasks.length === 0 && doneTasks.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">אין משימות עדיין</p>
            )}

            <div className="space-y-1">
              {activeTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-50">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0"
                  >
                    🗑
                  </button>
                  <span className="flex-1 text-sm text-gray-800">{task.text}</span>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggle(task)}
                    className="w-4 h-4 flex-shrink-0"
                  />
                </div>
              ))}
            </div>

            {/* Done tasks */}
            {doneTasks.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <p className="text-xs text-gray-400 flex-shrink-0">הושלמו</p>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-1">
                  {doneTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-50">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0"
                      >
                        🗑
                      </button>
                      <span className="flex-1 text-sm text-gray-400 line-through">{task.text}</span>
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleToggle(task)}
                        className="w-4 h-4 flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
