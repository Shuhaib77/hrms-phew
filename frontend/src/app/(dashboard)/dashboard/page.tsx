'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Skeleton, Avatar } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { formatDate, getStatusLabel } from '@/lib/utils';
import { CalendarDays, Clock, Users, CheckCircle, Trophy, Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { setCount } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
  const [eom, setEom] = useState<any>(null);
  const [todayTimeline, setTodayTimeline] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const role = user?.role;
        const promises: Promise<any>[] = [];

        if (role === 'ADMIN' || role === 'HR_MANAGER' || role === 'MANAGER') {
          promises.push(
            api.get('/attendance/stats').catch(() => ({ data: null })),
            api.get('/leave/all?status=PENDING&limit=5').catch(() => ({ data: [], pagination: { total: 0 } })),
            api.get('/employees/birthdays').catch(() => ({ data: [] })),
            api.get('/employees/anniversaries').catch(() => ({ data: [] })),
          );
        } else {
          promises.push(
            api.get('/attendance/stats').catch(() => ({ data: null })),
            api.get('/attendance/today').catch(() => ({ data: [] })),
            api.get('/leave/balance').catch(() => ({ data: [] })),
          );
        }
        promises.push(api.get('/performance/eom').catch(() => ({ data: null })));

        const [
          statsRes, extra1, extra2, extra3, extra4,
        ] = await Promise.all(promises);

        if (role === 'ADMIN' || role === 'HR_MANAGER' || role === 'MANAGER') {
          setStats(statsRes.data);
          setPendingLeaves(extra1?.data || []);
          setCount(extra1?.pagination?.total || 0);
          setBirthdays(extra2?.data || []);
          setAnniversaries(extra3?.data || []);
        } else {
          setStats(statsRes.data);
          setTodayTimeline(extra1?.data || []);
          setLeaveBalance(extra2?.data || []);
        }
        setEom(extra4?.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const isManager = isAdmin || user?.role === 'MANAGER';

  return (
    <div>
      <Topbar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-text">Welcome back, {user?.firstName}!</h2>
          <p className="text-text-secondary mt-1">Here&apos;s what&apos;s happening today.</p>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Today</p>
                    <p className="text-2xl font-bold text-text mt-1">{stats?.today || 0}</p>
                    <p className="text-xs text-text-tertiary mt-1">punches</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-brand-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">This Month</p>
                    <p className="text-2xl font-bold text-text mt-1">{stats?.month?.checkIns || 0}</p>
                    <p className="text-xs text-text-tertiary mt-1">check-ins</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {isManager && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-secondary">Pending</p>
                      <p className="text-2xl font-bold text-text mt-1">{pendingLeaves.length}</p>
                      <p className="text-xs text-text-tertiary mt-1">leave approvals</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Bell className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Late Days</p>
                    <p className="text-2xl font-bold text-text mt-1">{stats?.lateDays || 0}</p>
                    <p className="text-xs text-text-tertiary mt-1">this month</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-error/10 flex items-center justify-center">
                    <CalendarDays className="h-6 w-6 text-error" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link href="/attendance">
                    <Button variant="secondary"><Clock className="h-4 w-4" /> Check In / Out</Button>
                  </Link>
                  <Link href="/leave">
                    <Button variant="secondary"><CalendarDays className="h-4 w-4" /> Apply Leave</Button>
                  </Link>
                  {isAdmin && (
                    <>
                      <Link href="/locations">
                        <Button variant="secondary"><Users className="h-4 w-4" /> Manage Locations</Button>
                      </Link>
                      <Link href="/payroll">
                        <Button variant="secondary"><Clock className="h-4 w-4" /> Generate Payslips</Button>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employee: Today's Timeline */}
            {!isManager && (
              <Card>
                <CardHeader>
                  <CardTitle>Today&apos;s Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {todayTimeline.length === 0 ? (
                    <p className="text-sm text-text-tertiary">No activity recorded today.</p>
                  ) : (
                    <div className="space-y-3">
                      {todayTimeline.map((record: any) => (
                        <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
                          <div className={`h-2 w-2 rounded-full ${record.type === 'CHECK_IN' ? 'bg-success' : 'bg-info'}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text">{record.type === 'CHECK_IN' ? 'Checked In' : 'Checked Out'}</p>
                            <p className="text-xs text-text-tertiary">{formatDate(record.timestamp, { hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)}</p>
                          </div>
                          <Badge variant={record.status === 'APPROVED' ? 'success' : 'warning'}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Manager: Pending Leaves */}
            {isManager && (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Pending Leave Approvals</CardTitle>
                  <Link href="/leave">
                    <Button variant="ghost" size="sm">View All <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {pendingLeaves.length === 0 ? (
                    <p className="text-sm text-text-tertiary">No pending leave requests.</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingLeaves.slice(0, 5).map((leave: any) => (
                        <div key={leave.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
                          <Avatar firstName={leave.user?.firstName || ''} lastName={leave.user?.lastName || ''} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">
                              {leave.user?.firstName} {leave.user?.lastName}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {getStatusLabel(leave.type)} &middot; {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                            </p>
                          </div>
                          <Badge variant="warning">Pending</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Employee of the Month */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  Employee of the Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                ) : eom ? (
                  <div className="text-center">
                    <Avatar firstName={eom.user?.firstName || ''} lastName={eom.user?.lastName || ''} size="lg" className="mx-auto" />
                    <h4 className="text-lg font-semibold text-text mt-3">{eom.user?.firstName} {eom.user?.lastName}</h4>
                    <p className="text-sm text-text-secondary">{eom.user?.designation}</p>
                    <p className="text-xs text-text-tertiary mt-2">{eom.reason}</p>
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary text-center">No EOM selected for this month.</p>
                )}
              </CardContent>
            </Card>

            {/* Birthdays */}
            {isManager && birthdays.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-brand-600" /> Birthdays</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {birthdays.map((b: any) => (
                      <div key={b.id} className="flex items-center gap-3">
                        <Avatar firstName={b.firstName} lastName={b.lastName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-text">{b.firstName} {b.lastName}</p>
                          <p className="text-xs text-text-tertiary">{formatDate(b.dateOfBirth, { month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Anniversaries */}
            {isManager && anniversaries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-brand-600" /> Anniversaries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {anniversaries.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-3">
                        <Avatar firstName={a.firstName} lastName={a.lastName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-text">{a.firstName} {a.lastName}</p>
                          <p className="text-xs text-text-tertiary">{formatDate(a.joinDate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employee: Leave Balance */}
            {!isManager && leaveBalance.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Leave Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaveBalance.slice(0, 4).map((lb: any) => (
                      <div key={lb.type} className="flex items-center justify-between">
                        <span className="text-sm text-text">{getStatusLabel(lb.type)}</span>
                        <span className="text-sm font-medium text-text">{lb.available} / {lb.total}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
