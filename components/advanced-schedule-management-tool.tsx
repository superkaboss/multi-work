"use client"

import { useState, useMemo, useEffect } from "react"
import { format, addDays, isSameDay, isWithinInterval, isFirstDayOfMonth } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface Task {
  id: string
  name: string
  startDate: Date
  endDate: Date
  milestones: Milestone[]
}

interface Milestone {
  id: string
  name: string
  date: Date
}

function useSchedule() {
  const [tasks, setTasks] = useState<Task[]>([])

  const addTask = (task: Omit<Task, "id" | "milestones">) => {
    setTasks((prevTasks) => [
      ...prevTasks,
      { ...task, id: Math.random().toString(36).substr(2, 9), milestones: [] },
    ])
  }

  const updateTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    )
  }

  const deleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  const addMilestone = (taskId: string, milestone: Omit<Milestone, "id">) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              milestones: [
                ...task.milestones,
                { ...milestone, id: Math.random().toString(36).substr(2, 9) },
              ],
            }
          : task
      )
    )
  }

  const updateMilestone = (taskId: string, updatedMilestone: Milestone) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              milestones: task.milestones.map((m) =>
                m.id === updatedMilestone.id ? updatedMilestone : m
              ),
            }
          : task
      )
    )
  }

  const deleteMilestone = (taskId: string, milestoneId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              milestones: task.milestones.filter((m) => m.id !== milestoneId),
            }
          : task
      )
    )
  }

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  }
}

export function AdvancedScheduleManagementTool() {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  } = useSchedule()
  const [newTask, setNewTask] = useState({ name: "", startDate: new Date(), endDate: new Date() })
  const [newMilestone, setNewMilestone] = useState({ taskId: "", name: "", date: new Date() })
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<{ taskId: string; milestone: Milestone } | null>(null)
  const [milestoneOffsets, setMilestoneOffsets] = useState<{ [key: string]: number }>({})

  const handleAddTask = () => {
    addTask(newTask)
    setNewTask({ name: "", startDate: new Date(), endDate: new Date() })
  }

  const handleUpdateTask = () => {
    if (editingTask) {
      updateTask(editingTask)
      setEditingTask(null)
    }
  }

  const handleAddMilestone = () => {
    if (newMilestone.taskId) {
      addMilestone(newMilestone.taskId, { name: newMilestone.name, date: newMilestone.date })
      setNewMilestone({ taskId: "", name: "", date: new Date() })
    }
  }

  const handleUpdateMilestone = () => {
    if (editingMilestone) {
      updateMilestone(editingMilestone.taskId, editingMilestone.milestone)
      setEditingMilestone(null)
    }
  }

  const { startDate, endDate, dateRange } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date()
      return {
        startDate: today,
        endDate: addDays(today, 30),
        dateRange: Array.from({ length: 31 }, (_, i) => addDays(today, i)),
      }
    }

    const allDates = tasks.flatMap((task) => [task.startDate, task.endDate, ...task.milestones.map((m) => m.date)])
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))
    const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return {
      startDate: minDate,
      endDate: maxDate,
      dateRange: Array.from({ length: daysDiff }, (_, i) => addDays(minDate, i)),
    }
  }, [tasks])

  useEffect(() => {
    const calculateMilestoneOffsets = () => {
      const offsets: { [key: string]: number } = {};
      let lastOffset = 0;
      
      dateRange.forEach((date, index) => {
        const milestonesOnDate = tasks.flatMap(task => 
          task.milestones.filter(m => isSameDay(m.date, date))
        );

        if (milestonesOnDate.length > 0) {
          if (index > 0 && offsets[dateRange[index - 1].toISOString()]) {
            lastOffset = (lastOffset + 1) % 3;
          } else {
            lastOffset = 0;
          }
          offsets[date.toISOString()] = lastOffset;
        }
      });

      setMilestoneOffsets(offsets);
    };

    calculateMilestoneOffsets();
  }, [tasks, dateRange]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">スケジュール管理ツール</h1>
      
      <div className="mb-4 space-y-2">
        <Label htmlFor="task-name">タスク名</Label>
        <Input
          id="task-name"
          placeholder="タスク名"
          value={newTask.name}
          onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
        />
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">{format(newTask.startDate, "yyyy-MM-dd")}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={newTask.startDate}
                onSelect={(date) => date && setNewTask({ ...newTask, startDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">{format(newTask.endDate, "yyyy-MM-dd")}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={newTask.endDate}
                onSelect={(date) => date && setNewTask({ ...newTask, endDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={handleAddTask}>タスクを追加</Button>
      </div>

      <div className="mb-4 space-y-2">
        <Label htmlFor="task-select">タスク選択</Label>
        <select
          id="task-select"
          className="w-full border rounded p-2"
          value={newMilestone.taskId}
          onChange={(e) => setNewMilestone({ ...newMilestone, taskId: e.target.value })}
        >
          <option value="">タスクを選択</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
        <Label htmlFor="milestone-name">マイルストーン名</Label>
        <Input
          id="milestone-name"
          placeholder="マイルストーン名"
          value={newMilestone.name}
          onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">{format(newMilestone.date, "yyyy-MM-dd")}</Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={newMilestone.date}
              onSelect={(date) => date && setNewMilestone({ ...newMilestone, date: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button onClick={handleAddMilestone}>マイルストーンを追加</Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="flex border-b">
            <div className="w-40 font-bold">タスク</div>
            {dateRange.map((date) => (
              <div key={date.toISOString()} className="w-8 text-center text-sm">
                {format(date, "d")}
              </div>
            ))}
          </div>
          {tasks.map((task) => (
            <div key={task.id} className="flex border-b">
              <div className="w-40 py-2 flex items-center justify-between">
                <span>{task.name}</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">編集</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>タスクを編集</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="edit-task-name">タスク名</Label>
                      <Input
                        id="edit-task-name"
                        value={editingTask?.name || task.name}
                        onChange={(e) => setEditingTask({ ...task, name: e.target.value })}
                      />
                      <div className="flex space-x-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline">
                              {format(editingTask?.startDate || task.startDate, "yyyy-MM-dd")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={editingTask?.startDate || task.startDate}
                              onSelect={(date) => date && setEditingTask({ ...task, startDate: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline">
                              {format(editingTask?.endDate || task.endDate, "yyyy-MM-dd")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={editingTask?.endDate || task.endDate}
                              onSelect={(date) => date && setEditingTask({ ...task, endDate: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex justify-between">
                        <Button onClick={handleUpdateTask}>更新</Button>
                        <Button variant="destructive" onClick={() => deleteTask(task.id)}>削除</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {dateRange.map((date) => {
                const isStartDate = isSameDay(date, task.startDate)
                const isEndDate = isSameDay(date, task.endDate)
                const isInRange = isWithinInterval(date, { start: task.startDate, end: task.endDate })
                const milestone = task.milestones.find((m) => isSameDay(m.date, date))
                const hasMarker = isStartDate || isEndDate || !!milestone

                return (
                  <div key={date.toISOString()} className="w-8 flex flex-col items-center justify-center">
                    {isStartDate && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full" title={`開始日: ${format(task.startDate, "yyyy-MM-dd")}`} />
                    )}
                    {isInRange && !hasMarker && <div className="w-full h-1 bg-blue-500" />}
                    {isEndDate && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full" title={`終了日: ${format(task.endDate, "yyyy-MM-dd")}`} />
                    )}
                    {milestone && (
                      <div className="relative group">
                        <div className="w-4 h-4 bg-green-500 rounded-full" />
                        <div 
                          className="absolute left-full bg-white text-xs p-1 rounded shadow-md whitespace-nowrap z-10 ml-1"
                          style={{
                            top: `${(milestoneOffsets[date.toISOString()] || 0) * 20}px`,
                          }}
                        >
                          {milestone.name}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="absolute top-0 right-0 p-0 w-4 h-4">
                              <X className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>マイルストーンを編集</DialogTitle>
                            </DialogHeader>
                            <div  className="space-y-2">
                              <Label htmlFor="edit-milestone-name">マイルストーン名</Label>
                              <Input
                                id="edit-milestone-name"
                                value={editingMilestone?.milestone.name || milestone.name}
                                onChange={(e) => setEditingMilestone({
                                  taskId: task.id,
                                  milestone: { ...milestone, name: e.target.value }
                                })}
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline">
                                    {format(editingMilestone?.milestone.date || milestone.date, "yyyy-MM-dd")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={editingMilestone?.milestone.date || milestone.date}
                                    onSelect={(date) => date && setEditingMilestone({
                                      taskId: task.id,
                                      milestone: { ...milestone, date }
                                    })}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <div className="flex justify-between">
                                <Button onClick={handleUpdateMilestone}>更新</Button>
                                <Button variant="destructive" onClick={() => deleteMilestone(task.id, milestone.id)}>削除</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
