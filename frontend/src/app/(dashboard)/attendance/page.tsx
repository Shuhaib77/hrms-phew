'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Skeleton } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { formatDate, getStatusLabel } from '@/lib/utils';
import { Camera, MapPin, Clock, CheckCircle, XCircle, RefreshCw, History } from 'lucide-react';
import Link from 'next/link';
import { CameraCapture } from '@/components/camera-capture';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const [tab, setTab] = useState<'punch' | 'history'>(isAdmin ? 'history' : 'punch');
  const [loading, setLoading] = useState(false);
  const [punching, setPunching] = useState(false);
  const [punchResult, setPunchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [todayTimeline, setTodayTimeline] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState<{ available: boolean; lat?: number; lng?: number; error?: string }>({ available: false });
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [wifiBssid, setWifiBssid] = useState('');

  // Admin states
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [filters, setFilters] = useState({ status: '', type: '', dateFrom: '', dateTo: '', page: 1 });
  const [overrideModal, setOverrideModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [overrideNote, setOverrideNote] = useState('');
  const [lateReport, setLateReport] = useState<any[]>([]);
  const [view, setView] = useState<'overview' | 'late'>('overview');

  const isPunchedIn = todayTimeline.some(r => r.type === 'CHECK_IN' && r.status === 'APPROVED') &&
    !todayTimeline.some(r => r.type === 'CHECK_OUT' && r.status === 'APPROVED');

  useEffect(() => {
    loadData();
    getLocation();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [timeline, st] = await Promise.all([
        api.get<any[]>('/attendance/today').catch(() => ({ data: [] as any[] })),
        api.get<any>('/attendance/stats').catch(() => ({ data: null })),
      ]);
      setTodayTimeline(timeline.data || []);
      setStats(st.data);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus({ available: false, error: 'Geolocation not supported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocationStatus({ available: true, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setLocationStatus({ available: false, error: err.message }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePunch = async () => {
    setPunching(true);
    setPunchResult(null);
    try {
      if (!locationStatus.lat || !locationStatus.lng) {
        setPunchResult({ success: false, message: 'Unable to get your location. Please enable GPS.' });
        return;
      }

      const formData = new FormData();
      formData.append('latitude', String(locationStatus.lat));
      formData.append('longitude', String(locationStatus.lng));
      if (wifiBssid) {
        formData.append('wifiBssid', wifiBssid);
      }
      if (capturedBlob) {
        formData.append('selfie', capturedBlob, 'selfie.jpg');
      }

      const { data } = await api.post<any>('/attendance/punch', formData);
      setPunchResult({ success: true, message: `${data.type === 'CHECK_IN' ? 'Checked in' : 'Checked out'} successfully at ${formatDate(new Date(), { hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)}` });
      setCapturedBlob(null);
      loadData();
    } catch (err: any) {
      setPunchResult({ success: false, message: err.message || 'Punch failed' });
    } finally {
      setPunching(false);
    }
  };

  const loadAllRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      params.set('page', String(filters.page));
      params.set('limit', '20');
      const res = await api.get<any>(`/attendance/all?${params}`);
      setAllRecords(res.data || []);
      setPagination(res.pagination);
    } catch { /* ignore */ }
  };

  const loadLateReport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      params.set('page', '1');
      params.set('limit', '20');
      const res = await api.get<any>(`/attendance/late-report?${params}`);
      setLateReport(res.data || []);
    } catch { /* ignore */ }
  };

  const handleOverride = async () => {
    try {
      await api.post(`/attendance/${overrideModal.id}/override`, { status: 'APPROVED', overrideNote });
      setOverrideModal({ open: false, id: '' });
      setOverrideNote('');
      loadAllRecords();
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (tab === 'history' && isAdmin) {
      if (view === 'overview') loadAllRecords();
      else loadLateReport();
    }
  }, [tab, filters, view]);

  const nextPunchLabel = isPunchedIn ? 'Check Out' : 'Check In';

  // ---- EMPLOYEE PUNCH VIEW ----
  const PunchView = () => (
    <div className="max-w-lg mx-auto space-y-6">
      <Card className="text-center">
        <CardContent className="p-8">
          <div className="mb-6 space-y-4">
            <CameraCapture
              onCapture={(blob) => setCapturedBlob(blob)}
              onClear={() => setCapturedBlob(null)}
              capturedBlob={capturedBlob}
            />
            <h3 className="text-xl font-semibold text-text">{nextPunchLabel}</h3>
            <p className="text-sm text-text-secondary">
              {locationStatus.available
                ? `Location acquired (${locationStatus.lat?.toFixed(4)}, ${locationStatus.lng?.toFixed(4)})`
                : locationStatus.error || 'Acquiring location...'}
            </p>
          </div>

          <div className="mt-4 mb-2">
            <Input
              placeholder="Wi-Fi BSSID (for testing): AA:BB:CC:DD:EE:FF"
              value={wifiBssid}
              onChange={(e) => setWifiBssid(e.target.value)}
              className="text-xs text-center"
            />
            <p className="text-xs text-text-tertiary mt-1">Required if Wi-Fi verification is enabled. Native app sends this automatically.</p>
          </div>

          <Button
            onClick={handlePunch}
            loading={punching}
            size="lg"
            className="w-full"
            disabled={!locationStatus.available || !capturedBlob}
          >
            <Camera className="h-5 w-5" />
            {punching ? 'Processing...' : `${nextPunchLabel} with Camera`}
          </Button>

          <p className="text-xs text-text-tertiary mt-3">
            Your location will be verified against company geofence. Photo capture is required.
          </p>

          {!locationStatus.available && (
            <button onClick={getLocation} className="flex items-center gap-1 mx-auto mt-3 text-sm text-brand-600 hover:text-brand-700">
              <RefreshCw className="h-3 w-3" /> Retry location
            </button>
          )}
        </CardContent>
      </Card>

      {punchResult && (
        <Card className={punchResult.success ? 'border-success/30' : 'border-error/30'}>
          <CardContent className="p-4 flex items-center gap-3">
            {punchResult.success
              ? <CheckCircle className="h-5 w-5 text-success shrink-0" />
              : <XCircle className="h-5 w-5 text-error shrink-0" />
            }
            <p className={`text-sm ${punchResult.success ? 'text-success' : 'text-error'}`}>
              {punchResult.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Today's Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Today&apos;s Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : todayTimeline.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-4">No activity recorded today</p>
          ) : (
            <div className="space-y-2">
              {todayTimeline.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${record.type === 'CHECK_IN' ? 'bg-success' : 'bg-info'}`} />
                    <div>
                      <p className="text-sm font-medium text-text">
                        {record.type === 'CHECK_IN' ? 'Check In' : 'Check Out'}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {formatDate(record.timestamp, { hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)}
                        {record.location?.name && ` at ${record.location.name}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={record.status === 'APPROVED' ? 'success' : record.status === 'REJECTED' ? 'error' : 'warning'}>
                    {getStatusLabel(record.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-text">{stats.month?.checkIns || 0}</p>
              <p className="text-xs text-text-tertiary">Check-ins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-text">{stats.lateDays || 0}</p>
              <p className="text-xs text-text-tertiary">Late Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-text">{stats.averageHours || 0}h</p>
              <p className="text-xs text-text-tertiary">Avg Hours</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  // ---- ADMIN HISTORY VIEW ----
  const HistoryView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant={view === 'overview' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('overview')}>
            Attendance Log
          </Button>
          <Button variant={view === 'late' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('late')}>
            Late Report
          </Button>
        </div>
        <Link href="/locations">
          <Button variant="secondary" size="sm"><MapPin className="h-4 w-4" /> Manage Locations</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              options={[
                { value: '', label: 'All Status' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'MANUALLY_OVERRIDDEN', label: 'Overridden' },
              ]}
              placeholder="All Status"
            />
            <Input
              label="From"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
            />
            <Input
              label="To"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendance Log */}
      {view === 'overview' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-text-tertiary py-8">No records found</TableCell></TableRow>
                ) : allRecords.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <p className="font-medium text-text">{record.user?.firstName} {record.user?.lastName}</p>
                      <p className="text-xs text-text-tertiary">{record.user?.employeeId}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.type === 'CHECK_IN' ? 'success' : 'info'}>{record.type === 'CHECK_IN' ? 'In' : 'Out'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-text-secondary">
                      {formatDate(record.timestamp, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'APPROVED' ? 'success' : record.status === 'REJECTED' ? 'error' : 'warning'}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-text-secondary">{record.location?.name || '-'}</TableCell>
                    <TableCell>
                      {record.status === 'REJECTED' && (
                        <Button size="sm" variant="ghost" onClick={() => setOverrideModal({ open: true, id: record.id })}>
                          Override
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Late Report */}
      {view === 'late' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Late By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lateReport.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-text-tertiary py-8">No late entries found</TableCell></TableRow>
                ) : lateReport.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <p className="font-medium text-text">{record.user?.firstName} {record.user?.lastName}</p>
                      <p className="text-xs text-text-tertiary">{record.user?.employeeId}</p>
                    </TableCell>
                    <TableCell className="text-sm text-text-secondary">{record.user?.department?.name || '-'}</TableCell>
                    <TableCell className="text-sm text-text-secondary">{formatDate(record.date)}</TableCell>
                    <TableCell>
                      <Badge variant="warning">{record.lateMinutes} min</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={!pagination.hasPrev} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={!pagination.hasNext} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Override Modal */}
      <Modal open={overrideModal.open} onClose={() => setOverrideModal({ open: false, id: '' })} title="Override Attendance">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Approve this rejected attendance record. Provide a reason for the override.</p>
          <Input
            label="Reason for Override"
            value={overrideNote}
            onChange={(e) => setOverrideNote(e.target.value)}
            placeholder="e.g., Field visit to client site"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOverrideModal({ open: false, id: '' })}>Cancel</Button>
            <Button onClick={handleOverride} disabled={!overrideNote}><CheckCircle className="h-4 w-4" /> Approve</Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  return (
    <div>
      <Topbar title="Attendance" />
      <div className="p-6">
        {!isAdmin && (
          <div className="flex gap-2 mb-6">
            <Button variant={tab === 'punch' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('punch')}>
              <Camera className="h-4 w-4" /> Check In/Out
            </Button>
            <Button variant={tab === 'history' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('history')}>
              <History className="h-4 w-4" /> History
            </Button>
          </div>
        )}

        {tab === 'punch' && !isAdmin && <PunchView />}
        {tab === 'history' && <HistoryView />}
        {tab === 'punch' && isAdmin && <PunchView />}
      </div>
    </div>
  );
}
