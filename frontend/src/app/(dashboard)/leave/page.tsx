'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Tabs, TabsList, TabsTrigger, TabsContent, Skeleton } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { CalendarDays, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function LeavePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'MANAGER';
  const [tab, setTab] = useState('my');
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balance, setBalance] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [showApply, setShowApply] = useState(false);
  const [applyData, setApplyData] = useState({ type: 'CASUAL', startDate: '', endDate: '', reason: '' });
  const [applying, setApplying] = useState(false);

  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [allPagination, setAllPagination] = useState<any>(null);
  const [leaveFilter, setLeaveFilter] = useState({ status: '', page: 1 });

  const loadMyLeaves = async () => {
    try {
      const [l, b] = await Promise.all([
        api.get<any>('/leave/my?page=1&limit=20'),
        api.get<any[]>('/leave/balance'),
      ]);
      setLeaves(l.data || []);
      setPagination(l.pagination);
      setBalance(b.data || []);
    } catch { /* ignore */ }
  };

  const loadAllLeaves = async () => {
    try {
      const params = new URLSearchParams();
      if (leaveFilter.status) params.set('status', leaveFilter.status);
      params.set('page', String(leaveFilter.page));
      params.set('limit', '20');
      const res = await api.get<any>(`/leave/all?${params}`);
      setAllLeaves(res.data || []);
      setAllPagination(res.pagination);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'my' || !isAdmin) {
      loadMyLeaves().finally(() => setLoading(false));
    } else {
      loadAllLeaves().finally(() => setLoading(false));
    }
  }, [tab, leaveFilter]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post('/leave/request', applyData);
      setShowApply(false);
      setApplyData({ type: 'CASUAL', startDate: '', endDate: '', reason: '' });
      loadMyLeaves();
    } catch { /* ignore */ }
    finally { setApplying(false); }
  };

  const handleApprove = async (id: string, status: string) => {
    try {
      await api.put(`/leave/${id}/approve`, { status, comment: status === 'REJECTED' ? 'Rejected' : undefined });
      loadAllLeaves();
    } catch { /* ignore */ }
  };

  const MyLeaveView = () => (
    <div className="space-y-6">
      {balance.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {balance.map((b: any) => (
            <Card key={b.type}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-text">{b.available}</p>
                <p className="text-xs text-text-tertiary mt-1">{getStatusLabel(b.type)}</p>
                <p className="text-xs text-text-tertiary">of {b.total}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>My Leave Requests</CardTitle>
          <Button size="sm" onClick={() => setShowApply(true)}><Plus className="h-4 w-4" /> Apply Leave</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ) : leaves.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-text-tertiary py-8">No leave requests</TableCell></TableRow>
              ) : leaves.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell><Badge>{getStatusLabel(l.type)}</Badge></TableCell>
                  <TableCell className="text-sm">{formatDate(l.startDate)}</TableCell>
                  <TableCell className="text-sm">{formatDate(l.endDate)}</TableCell>
                  <TableCell><Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'error' : 'warning'}>{getStatusLabel(l.status)}</Badge></TableCell>
                  <TableCell className="text-sm">{l.approver ? `${l.approver.firstName} ${l.approver.lastName}` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave">
        <div className="space-y-4">
          <Select
            label="Leave Type"
            value={applyData.type}
            onChange={(e) => setApplyData({ ...applyData, type: e.target.value })}
            options={[
              { value: 'SICK', label: 'Sick Leave' },
              { value: 'CASUAL', label: 'Casual Leave' },
              { value: 'PAID', label: 'Paid Leave' },
              { value: 'UNPAID', label: 'Unpaid Leave' },
              { value: 'OPTIONAL', label: 'Optional Holiday' },
            ]}
          />
          <Input label="Start Date" type="date" value={applyData.startDate} onChange={(e) => setApplyData({ ...applyData, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={applyData.endDate} onChange={(e) => setApplyData({ ...applyData, endDate: e.target.value })} />
          <Input label="Reason" value={applyData.reason} onChange={(e) => setApplyData({ ...applyData, reason: e.target.value })} placeholder="Optional reason" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowApply(false)}>Cancel</Button>
            <Button onClick={handleApply} loading={applying} disabled={!applyData.startDate || !applyData.endDate}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  const AllLeaveView = () => (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Select
          value={leaveFilter.status}
          onChange={(e) => setLeaveFilter({ ...leaveFilter, status: e.target.value, page: 1 })}
          options={[
            { value: '', label: 'All Status' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
          ]}
          placeholder="All Status"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ) : allLeaves.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-text-tertiary py-8">No leave requests</TableCell></TableRow>
              ) : allLeaves.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <p className="font-medium text-text">{l.user?.firstName} {l.user?.lastName}</p>
                    <p className="text-xs text-text-tertiary">{l.user?.employeeId}</p>
                  </TableCell>
                  <TableCell><Badge>{getStatusLabel(l.type)}</Badge></TableCell>
                  <TableCell className="text-sm">{formatDate(l.startDate)}</TableCell>
                  <TableCell className="text-sm">{formatDate(l.endDate)}</TableCell>
                  <TableCell><Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'error' : 'warning'}>{getStatusLabel(l.status)}</Badge></TableCell>
                  <TableCell>
                    {l.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleApprove(l.id, 'APPROVED')}>
                          <CheckCircle className="h-4 w-4 text-success" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleApprove(l.id, 'REJECTED')}>
                          <XCircle className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {allPagination && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Page {allPagination.page} of {allPagination.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={!allPagination.hasPrev} onClick={() => setLeaveFilter({ ...leaveFilter, page: leaveFilter.page - 1 })}>Prev</Button>
            <Button size="sm" variant="secondary" disabled={!allPagination.hasNext} onClick={() => setLeaveFilter({ ...leaveFilter, page: leaveFilter.page + 1 })}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Topbar title="Leave Management" />
      <div className="p-6">
        {isAdmin && (
          <div className="flex gap-2 mb-6">
            <Button variant={tab === 'my' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('my')}>My Leaves</Button>
            <Button variant={tab === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('all')}>All Requests</Button>
          </div>
        )}
        {tab === 'my' ? <MyLeaveView /> : <AllLeaveView />}
      </div>
    </div>
  );
}
