'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Skeleton, Avatar, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Mail, Phone, Calendar, Briefcase, MapPin, ChevronLeft, Star } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<any>(`/employees/${id}`);
      setEmployee(data);
      api.get<any>(`/attendance/all?userId=${id}&limit=10`).then(r => setAttendance(r.data || [])).catch(() => {});
      api.get<any>(`/leave/my?page=1&limit=10`).then(r => setLeaves(r.data || [])).catch(() => {});
      api.get<any[]>(`/performance/reviews/${id}`).then(r => setReviews(r.data)).catch(() => {});
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div>
        <Topbar title="Employee Profile" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div>
        <Topbar title="Employee Profile" />
        <div className="p-6 text-center text-text-tertiary">Employee not found</div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title={employee.firstName + ' ' + employee.lastName} />
      <div className="p-6 space-y-6">
        <Link href="/employees" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Directory
        </Link>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar firstName={employee.firstName} lastName={employee.lastName} avatarUrl={employee.avatar} size="lg" className="h-20 w-20 text-xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-text">{employee.firstName} {employee.lastName}</h2>
                  <Badge variant={employee.isActive ? 'success' : 'error'}>{employee.isActive ? 'Active' : 'Inactive'}</Badge>
                  <Badge variant="brand">{getStatusLabel(employee.role)}</Badge>
                </div>
                <p className="text-text-secondary mt-1">{employee.designation || 'No designation'}</p>
                <p className="text-sm text-text-tertiary">Employee ID: {employee.employeeId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-text-tertiary" /><span className="text-sm text-text">{employee.email}</span></div>
                  {employee.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-text-tertiary" /><span className="text-sm text-text">{employee.phone}</span></div>}
                  {employee.dateOfBirth && <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-text-tertiary" /><span className="text-sm text-text">{formatDate(employee.dateOfBirth)}</span></div>}
                  {employee.address && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-text-tertiary" /><span className="text-sm text-text">{employee.address}</span></div>}
                  {employee.emergencyContact && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-text-tertiary" /><span className="text-sm text-text">Emergency: {employee.emergencyContact} ({employee.emergencyPhone})</span></div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-text-tertiary">Department</p>
                    <p className="text-sm font-medium text-text">{employee.department?.name || '-'}</p>
                  </div>
                  {employee.dateOfJoining && <div>
                    <p className="text-sm text-text-tertiary">Date of Joining</p>
                    <p className="text-sm font-medium text-text">{formatDate(employee.dateOfJoining)}</p>
                  </div>}
                  <div>
                    <p className="text-sm text-text-tertiary">Manager</p>
                    <p className="text-sm font-medium text-text">{employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '-'}</p>
                  </div>
                  {employee.subordinates?.length > 0 && <div>
                    <p className="text-sm text-text-tertiary">Direct Reports ({employee.subordinates.length})</p>
                    <div className="mt-1 space-y-1">
                      {employee.subordinates.map((sub: any) => (
                        <p key={sub.id} className="text-sm text-text">{sub.firstName} {sub.lastName}</p>
                      ))}
                    </div>
                  </div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Late</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-text-tertiary py-8">No records</TableCell></TableRow>
                    ) : attendance.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm">{formatDate(a.date)}</TableCell>
                        <TableCell><Badge variant={a.type === 'CHECK_IN' ? 'success' : 'info'}>{a.type === 'CHECK_IN' ? 'In' : 'Out'}</Badge></TableCell>
                        <TableCell><Badge variant={a.status === 'APPROVED' ? 'success' : a.status === 'REJECTED' ? 'error' : 'warning'}>{getStatusLabel(a.status)}</Badge></TableCell>
                        <TableCell>{a.isLate ? <Badge variant="warning">{a.lateMinutes} min</Badge> : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <Card>
              <CardHeader><CardTitle>Leave History</CardTitle></CardHeader>
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
                    {leaves.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-text-tertiary py-8">No leave records</TableCell></TableRow>
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
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader><CardTitle>Performance Reviews</CardTitle></CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-sm text-text-tertiary text-center py-8">No performance reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r: any) => (
                      <Card key={r.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-text">{r.cycle}</p>
                              <p className="text-xs text-text-tertiary">Reviewed by {r.reviewer?.firstName} {r.reviewer?.lastName}</p>
                            </div>
                            <div className="flex items-center gap-1 text-warning">
                              <Star className="h-5 w-5 fill-current" />
                              <span className="font-bold text-text">{r.overallScore.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { label: 'Quality', value: r.quality },
                              { label: 'Timeliness', value: r.timeliness },
                              { label: 'Collaboration', value: r.collaboration },
                              { label: 'Ownership', value: r.ownership },
                            ].map((metric) => (
                              <div key={metric.label} className="text-center p-2 rounded-lg bg-surface-secondary">
                                <p className="text-lg font-semibold text-text">{metric.value}/10</p>
                                <p className="text-xs text-text-tertiary">{metric.label}</p>
                              </div>
                            ))}
                          </div>
                          {r.feedback && <p className="text-sm text-text-secondary mt-3 italic">&ldquo;{r.feedback}&rdquo;</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-text-tertiary text-center py-8">Project history coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
