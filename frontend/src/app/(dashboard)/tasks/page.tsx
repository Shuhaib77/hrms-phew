'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Select, Modal, Skeleton, Avatar } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, MoreHorizontal, ChevronRight, User, Briefcase } from 'lucide-react';
import Link from 'next/link';

const statusColumns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const statusLabels: Record<string, string> = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const statusColors: Record<string, string> = {
  TODO: 'border-t-text-tertiary',
  IN_PROGRESS: 'border-t-info',
  IN_REVIEW: 'border-t-warning',
  DONE: 'border-t-success',
};

export default function TasksPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ title: '', description: '', projectId: '', priority: 'MEDIUM', assigneeIds: [] as string[] });
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        api.get<any[]>('/tasks').catch(() => ({ data: [] as any[] })),
        api.get<any[]>('/projects').catch(() => ({ data: [] as any[] })),
      ]);
      setTasks(t.data || []);
      setProjects(p.data || []);
      api.get<any>('/employees?limit=100').then(r => setEmployees(r.data || [])).catch(() => {});
    } finally { setLoading(false); }
  };

  const groupedTasks = statusColumns.map(status => ({
    status,
    label: statusLabels[status],
    tasks: tasks.filter((t: any) => t.status === status),
  }));

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch { /* ignore */ }
  };

  const handleCreate = async () => {
    try {
      const { data: task } = await api.post<any>('/tasks', {
        title: createData.title,
        description: createData.description || undefined,
        priority: createData.priority,
        projectId: createData.projectId || undefined,
        assigneeIds: createData.assigneeIds.length > 0 ? createData.assigneeIds : undefined,
      });
      setTasks(prev => [...prev, task]);
      setShowCreate(false);
      setCreateData({ title: '', description: '', projectId: '', priority: 'MEDIUM', assigneeIds: [] });
    } catch { /* ignore */ }
  };

  const priorityColors: Record<string, string> = {
    LOW: 'default', MEDIUM: 'info', HIGH: 'warning', URGENT: 'error',
  };

  return (
    <div>
      <Topbar title="Tasks & Projects" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> New Task
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupedTasks.map((col) => (
            <div key={col.status}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-text">{col.label}</h3>
                <span className="text-xs text-text-tertiary bg-surface-tertiary px-2 py-0.5 rounded-full">{col.tasks.length}</span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {loading ? (
                  [1,2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)
                ) : col.tasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-tertiary border-2 border-dashed border-border rounded-xl">
                    No tasks
                  </div>
                ) : col.tasks.map((task: any) => (
                  <Card key={task.id} className={`border-t-4 ${statusColors[col.status]}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-text">{task.title}</h4>
                        <Badge variant={priorityColors[task.priority] as any}>{task.priority}</Badge>
                      </div>
                      <p className="text-xs text-text-tertiary mb-3 line-clamp-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {task.assignees?.slice(0, 3).map((a: any) => (
                            <div key={a.id} className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold flex items-center justify-center">
                              {a.user?.firstName?.[0]}{a.user?.lastName?.[0]}
                            </div>
                          ))}
                          {task.assignees?.length > 3 && (
                            <span className="text-xs text-text-tertiary">+{task.assignees.length - 3}</span>
                          )}
                        </div>
                        {task.dueDate && (
                          <span className="text-xs text-text-tertiary">{formatDate(task.dueDate)}</span>
                        )}
                      </div>
                      {/* Quick status change */}
                      <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                        {statusColumns.map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(task.id, s)}
                            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                              task.status === s 
                                ? 'bg-brand-100 text-brand-700' 
                                : 'text-text-tertiary hover:bg-surface-tertiary'
                            }`}
                          >
                            {statusLabels[s]}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Create Task Modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Task" size="lg">
          <div className="space-y-4">
            <Input label="Title" value={createData.title} onChange={(e) => setCreateData({ ...createData, title: e.target.value })} placeholder="Task title" />
            <Input label="Description" value={createData.description} onChange={(e) => setCreateData({ ...createData, description: e.target.value })} placeholder="Description" />
            <Select
              label="Priority"
              value={createData.priority}
              onChange={(e) => setCreateData({ ...createData, priority: e.target.value })}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!createData.title}>Create Task</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
