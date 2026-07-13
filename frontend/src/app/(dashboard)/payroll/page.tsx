'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Skeleton } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, getStatusLabel } from '@/lib/utils';
import { Download, Plus, FileText, Settings, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function PayrollPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const [tab, setTab] = useState('payslips');
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [allPayslips, setAllPayslips] = useState<any[]>([]);
  const [allPagination, setAllPagination] = useState<any>(null);
  const [salaryStructure, setSalaryStructure] = useState<any>(null);

  const [genModal, setGenModal] = useState(false);
  const [genData, setGenData] = useState({ userId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [employees, setEmployees] = useState<any[]>([]);
  const [filter, setFilter] = useState({ page: 1, limit: '20' });

  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [detailModal, setDetailModal] = useState(false);

  const [salaryModal, setSalaryModal] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ userId: '', basic: 0, hra: 0, allowanceKeys: [] as string[], allowanceVals: [] as number[], deductionKeys: [] as string[], deductionVals: [] as number[], effectiveFrom: '' });
  const [settingSalary, setSettingSalary] = useState(false);

  const [companySettings, setCompanySettings] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState({ payrollMode: '', currency: '', standardWorkHours: 8, standardWorkDays: 22, weekStartDay: 1 });
  const [savingSettings, setSavingSettings] = useState(false);

  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([]);
  const [overtimeModal, setOvertimeModal] = useState(false);
  const [overtimeForm, setOvertimeForm] = useState({ date: '', hours: 1, reason: '' });
  const [overtimeActionId, setOvertimeActionId] = useState('');

  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputeModal, setDisputeModal] = useState(false);
  const [disputeForm, setDisputeForm] = useState({ payslipId: '', attendanceId: '', reason: '', description: '' });
  const [raiseDisputeLoading, setRaiseDisputeLoading] = useState(false);

  const [resolveDisputeId, setResolveDisputeId] = useState('');
  const [resolveDisputeStatus, setResolveDisputeStatus] = useState('');
  const [resolveDisputeResolution, setResolveDisputeResolution] = useState('');
  const [resolveDisputeLoading, setResolveDisputeLoading] = useState(false);

  const [incompletePunches, setIncompletePunches] = useState<any[]>([]);
  const [resolvePunchId, setResolvePunchId] = useState('');
  const [resolvePunchResolution, setResolvePunchResolution] = useState('FULL_DAY');
  const [resolvePunchCheckout, setResolvePunchCheckout] = useState('');
  const [resolvePunchNote, setResolvePunchNote] = useState('');

  useEffect(() => {
    loadData();
    if (isAdmin) {
      api.get<any>('/employees?limit=100').then(r => setEmployees(r.data || [])).catch(() => {});
      api.get<any>('/settings/company').then(r => {
        setCompanySettings(r.data);
        setSettingsForm({
          payrollMode: r.data?.payrollMode || 'SIMPLE',
          currency: r.data?.currency || 'INR',
          standardWorkHours: r.data?.standardWorkHours || 8,
          standardWorkDays: r.data?.standardWorkDays || 22,
          weekStartDay: r.data?.weekStartDay || 1,
        });
      }).catch(() => {});
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [pRes, otRes, dRes, ipRes] = await Promise.all([
          api.get<any>(`/payroll/payslips?page=${filter.page}&limit=${filter.limit}`),
          api.get<any[]>('/payroll/overtime').catch(() => ({ data: [] })),
          api.get<any[]>('/payroll/disputes').catch(() => ({ data: [] })),
          api.get<any[]>('/payroll/exceptions/incomplete-punches').catch(() => ({ data: [] })),
        ]);
        setAllPayslips(pRes.data || []);
        setAllPagination(pRes.pagination);
        setOvertimeRequests(otRes.data || []);
        setDisputes(dRes.data || []);
        setIncompletePunches(ipRes.data || []);
      } else {
        const [p, s] = await Promise.all([
          api.get<any[]>('/payroll/my-payslips'),
          api.get<any>('/payroll/salary-structure'),
        ]);
        setPayslips(p.data || []);
        setSalaryStructure(s.data);
      }
    } catch {} finally { setLoading(false); }
  };

  const handleDownload = (id: string) => {
    const token = localStorage.getItem('phew-hrms-auth') ? JSON.parse(localStorage.getItem('phew-hrms-auth') || '{}')?.state?.token : '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    window.open(baseUrl + '/payroll/my-payslips/' + id + '/download?token=' + token, '_blank');
  };

  const handleGenerate = async () => {
    try { await api.post('/payroll/payslips/generate', genData); setGenModal(false); loadData(); } catch {}
  };

  const handleViewDetails = (p: any) => { setSelectedPayslip(p); setDetailModal(true); };

  const openSalaryModal = () => {
    setSalaryForm({ userId: '', basic: 0, hra: 0, allowanceKeys: [], allowanceVals: [], deductionKeys: [], deductionVals: [], effectiveFrom: '' });
    setSalaryModal(true);
  };

  const handleSaveSalary = async () => {
    setSettingSalary(true);
    try {
      const allowances: Record<string, number> = {};
      salaryForm.allowanceKeys.forEach((k, i) => { if (k) allowances[k] = salaryForm.allowanceVals[i] || 0; });
      const deductions: Record<string, number> = {};
      salaryForm.deductionKeys.forEach((k, i) => { if (k) deductions[k] = salaryForm.deductionVals[i] || 0; });
      await api.put('/payroll/salary-structure', {
        userId: salaryForm.userId, basic: salaryForm.basic, hra: salaryForm.hra, allowances, deductions,
        effectiveFrom: salaryForm.effectiveFrom || undefined,
      });
      setSalaryModal(false);
      loadData();
    } catch {} finally { setSettingSalary(false); }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try { const res = await api.put<any>('/settings/company', settingsForm); setCompanySettings(res.data); } catch {}
    finally { setSavingSettings(false); }
  };

  const handleOvertimeAction = async (id: string, status: string) => {
    setOvertimeActionId(id);
    try { await api.put('/payroll/overtime/' + id + '/approve', { status }); loadData(); } catch {}
    finally { setOvertimeActionId(''); }
  };

  const handleRaiseDispute = async () => {
    setRaiseDisputeLoading(true);
    try { await api.post('/payroll/disputes', disputeForm); setDisputeModal(false); setDisputeForm({ payslipId: '', attendanceId: '', reason: '', description: '' }); } catch {}
    finally { setRaiseDisputeLoading(false); }
  };

  const handleResolveDispute = async () => {
    setResolveDisputeLoading(true);
    try {
      await api.put('/payroll/disputes/' + resolveDisputeId + '/resolve', { status: resolveDisputeStatus, resolution: resolveDisputeResolution });
      setResolveDisputeId(''); setResolveDisputeStatus(''); setResolveDisputeResolution(''); setResolveDisputeLoading(false);
      loadData();
    } catch {} finally { setResolveDisputeLoading(false); }
  };

  return (
    <div>
      <Topbar title="Payroll" />
      <div className="p-6">
        {!isAdmin ? (
          <div className="space-y-6">
            {salaryStructure && (
              <Card>
                <CardHeader><CardTitle>Current Salary Structure</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className="text-sm text-text-tertiary">Basic</p><p className="text-lg font-semibold text-text">{formatCurrency(salaryStructure.basic)}</p></div>
                    <div><p className="text-sm text-text-tertiary">HRA</p><p className="text-lg font-semibold text-text">{formatCurrency(salaryStructure.hra)}</p></div>
                    <div><p className="text-sm text-text-tertiary">Monthly Gross</p><p className="text-lg font-semibold text-text">{formatCurrency(salaryStructure.monthlyGross)}</p></div>
                    <div><p className="text-sm text-text-tertiary">Net Pay</p><p className="text-lg font-semibold text-text">{formatCurrency(salaryStructure.monthlyNet)}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>Payslips</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead><TableHead>Mode</TableHead><TableHead>Gross Pay</TableHead>
                      <TableHead>Deductions</TableHead><TableHead>Net Pay</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                    ) : payslips.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-text-tertiary py-8">No payslips</TableCell></TableRow>
                    ) : payslips.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-text">{months[p.month - 1]} {p.year}</TableCell>
                        <TableCell><Badge variant="default">{p.payrollMode}</Badge></TableCell>
                        <TableCell className="text-sm">{formatCurrency(p.grossPay)}</TableCell>
                        <TableCell className="text-sm text-error">{formatCurrency(p.totalDeductions)}</TableCell>
                        <TableCell className="font-semibold text-text">{formatCurrency(p.netPay)}</TableCell>
                        <TableCell><Badge variant={p.status === 'FINALIZED' ? 'success' : 'warning'}>{getStatusLabel(p.status)}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(p)}><FileText className="h-4 w-4" /></Button>
                            {p.isLocked && <Button size="sm" variant="ghost" onClick={() => handleDownload(p.id)}><Download className="h-4 w-4" /></Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-border pb-2">
              {['payslips', 'salary', 'overtime', 'disputes', 'settings'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ' + (tab === t ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-600' : 'text-text-secondary hover:text-text')}>
                  {t === 'payslips' ? 'Payslips' : t === 'salary' ? 'Manage Salary' : t === 'overtime' ? 'Overtime' : t === 'disputes' ? 'Exceptions' : 'Settings'}
                </button>
              ))}
            </div>

            {tab === 'payslips' && (
              <div className="space-y-4 pt-4">
                <div className="flex gap-3">
                  <Button onClick={() => setGenModal(true)}><Plus className="h-4 w-4" /> Generate Payslip</Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead><TableHead>Period</TableHead><TableHead>Mode</TableHead>
                          <TableHead>Gross</TableHead><TableHead>Short Hrs</TableHead><TableHead>OT</TableHead>
                          <TableHead>Net</TableHead><TableHead>Late Pen</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow><TableCell colSpan={10}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                        ) : allPayslips.length === 0 ? (
                          <TableRow><TableCell colSpan={10} className="text-center text-text-tertiary py-8">No payslips</TableCell></TableRow>
                        ) : allPayslips.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell><p className="font-medium text-text">{p.user?.firstName} {p.user?.lastName}</p><p className="text-xs text-text-tertiary">{p.user?.employeeId}</p></TableCell>
                            <TableCell className="text-sm font-medium">{months[p.month - 1]} {p.year}</TableCell>
                            <TableCell><Badge variant="default">{p.payrollMode}</Badge></TableCell>
                            <TableCell className="text-sm">{formatCurrency(p.grossPay)}</TableCell>
                            <TableCell className="text-sm">{p.shortHours > 0 ? <span className="text-warning">{p.shortHours}h</span> : '-'}</TableCell>
                            <TableCell className="text-sm">{p.overtimeHours > 0 ? <span className="text-success">{p.overtimeHours}h</span> : '-'}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(p.netPay)}</TableCell>
                            <TableCell>{p.latePenalties?.length > 0 ? <Badge variant="warning">{formatCurrency(p.latePenalties.reduce((a: number, b: any) => a + b.amount, 0))}</Badge> : '-'}</TableCell>
                            <TableCell><Badge variant={p.status === 'FINALIZED' ? 'success' : 'warning'}>{getStatusLabel(p.status)}</Badge></TableCell>
                            <TableCell><Button size="sm" variant="ghost" onClick={() => handleViewDetails(p)}><FileText className="h-4 w-4" /></Button></TableCell>
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
                      <Button size="sm" variant="secondary" disabled={!allPagination.hasPrev} onClick={() => setFilter({ ...filter, page: filter.page - 1 })}>Prev</Button>
                      <Button size="sm" variant="secondary" disabled={!allPagination.hasNext} onClick={() => setFilter({ ...filter, page: filter.page + 1 })}>Next</Button>
                    </div>
                  </div>
                )}
                <Modal open={genModal} onClose={() => setGenModal(false)} title="Generate Payslip">
                  <div className="space-y-4">
                    <Select label="Employee" value={genData.userId} onChange={(e) => setGenData({ ...genData, userId: e.target.value })}
                      options={employees.map((e: any) => ({ value: e.id, label: e.firstName + ' ' + e.lastName + ' (' + e.employeeId + ')' }))}
                      placeholder="Select employee" />
                    <Select label="Month" value={String(genData.month)} onChange={(e) => setGenData({ ...genData, month: parseInt(e.target.value) })}
                      options={months.map((m, i) => ({ value: String(i + 1), label: m }))} />
                    <Input label="Year" type="number" value={String(genData.year)} onChange={(e) => setGenData({ ...genData, year: parseInt(e.target.value) })} />
                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" onClick={() => setGenModal(false)}>Cancel</Button>
                      <Button onClick={handleGenerate} disabled={!genData.userId}>Generate</Button>
                    </div>
                  </div>
                </Modal>
              </div>
            )}

            {tab === 'salary' && (
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-secondary">Set or update salary structure for any employee.</p>
                  <Button onClick={openSalaryModal}><DollarSign className="h-4 w-4" /> Set Salary</Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead><TableHead>Basic</TableHead><TableHead>HRA</TableHead>
                          <TableHead>Gross/Month</TableHead><TableHead>Net/Month</TableHead><TableHead>Effective</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center text-text-tertiary py-8">No employees</TableCell></TableRow>
                        ) : employees.map((e: any) => (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium text-text">{e.firstName} {e.lastName}</TableCell>
                            <TableCell>{e.salaryStructures?.[0] ? formatCurrency(e.salaryStructures[0].basic) : '-'}</TableCell>
                            <TableCell>{e.salaryStructures?.[0] ? formatCurrency(e.salaryStructures[0].hra) : '-'}</TableCell>
                            <TableCell>{e.salaryStructures?.[0] ? formatCurrency(e.salaryStructures[0].monthlyGross) : '-'}</TableCell>
                            <TableCell>{e.salaryStructures?.[0] ? formatCurrency(e.salaryStructures[0].monthlyNet) : '-'}</TableCell>
                            <TableCell className="text-sm text-text-tertiary">{e.salaryStructures?.[0] ? new Date(e.salaryStructures[0].effectiveFrom).toLocaleDateString() : 'Not set'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Modal open={salaryModal} onClose={() => setSalaryModal(false)} title="Manage Salary Structure" size="lg">
                  <div className="space-y-4">
                    <Select label="Employee" value={salaryForm.userId} onChange={(e) => setSalaryForm({ ...salaryForm, userId: e.target.value })}
                      options={employees.map((e: any) => ({ value: e.id, label: e.firstName + ' ' + e.lastName + ' (' + e.employeeId + ')' }))}
                      placeholder="Select employee" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Basic Pay" type="number" value={String(salaryForm.basic)} onChange={(e) => setSalaryForm({ ...salaryForm, basic: Number(e.target.value) })} />
                      <Input label="HRA" type="number" value={String(salaryForm.hra)} onChange={(e) => setSalaryForm({ ...salaryForm, hra: Number(e.target.value) })} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-text">Allowances</p>
                        <Button size="sm" variant="secondary" onClick={() => setSalaryForm({ ...salaryForm, allowanceKeys: [...salaryForm.allowanceKeys, ''], allowanceVals: [...salaryForm.allowanceVals, 0] })}>+ Add</Button>
                      </div>
                      {salaryForm.allowanceKeys.map((_, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <Input placeholder="Name" value={salaryForm.allowanceKeys[i]} onChange={(e) => { const k = [...salaryForm.allowanceKeys]; k[i] = e.target.value; setSalaryForm({ ...salaryForm, allowanceKeys: k }); }} />
                          <Input placeholder="Amount" type="number" value={String(salaryForm.allowanceVals[i])} onChange={(e) => { const v = [...salaryForm.allowanceVals]; v[i] = Number(e.target.value); setSalaryForm({ ...salaryForm, allowanceVals: v }); }} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-text">Deductions</p>
                        <Button size="sm" variant="secondary" onClick={() => setSalaryForm({ ...salaryForm, deductionKeys: [...salaryForm.deductionKeys, ''], deductionVals: [...salaryForm.deductionVals, 0] })}>+ Add</Button>
                      </div>
                      {salaryForm.deductionKeys.map((_, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <Input placeholder="Name" value={salaryForm.deductionKeys[i]} onChange={(e) => { const k = [...salaryForm.deductionKeys]; k[i] = e.target.value; setSalaryForm({ ...salaryForm, deductionKeys: k }); }} />
                          <Input placeholder="Amount" type="number" value={String(salaryForm.deductionVals[i])} onChange={(e) => { const v = [...salaryForm.deductionVals]; v[i] = Number(e.target.value); setSalaryForm({ ...salaryForm, deductionVals: v }); }} />
                        </div>
                      ))}
                    </div>
                    <Input label="Effective From (optional)" type="date" value={salaryForm.effectiveFrom} onChange={(e) => setSalaryForm({ ...salaryForm, effectiveFrom: e.target.value })} />
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="secondary" onClick={() => setSalaryModal(false)}>Cancel</Button>
                      <Button onClick={handleSaveSalary} loading={settingSalary} disabled={!salaryForm.userId}>Save Structure</Button>
                    </div>
                  </div>
                </Modal>
              </div>
            )}

            {tab === 'overtime' && (
              <div className="pt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Overtime Requests</CardTitle>
                    <Button size="sm" variant="secondary" onClick={() => setOvertimeModal(true)}><Plus className="h-4 w-4" /> Request OT</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Hours</TableHead>
                          <TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overtimeRequests.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center text-text-tertiary py-8">No overtime requests</TableCell></TableRow>
                        ) : overtimeRequests.map((o: any) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-medium text-text">{o.user?.firstName} {o.user?.lastName}</TableCell>
                            <TableCell className="text-sm">{new Date(o.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-sm">{o.hours}h</TableCell>
                            <TableCell className="text-sm text-text-secondary">{o.reason || '-'}</TableCell>
                            <TableCell><Badge variant={o.status === 'APPROVED' ? 'success' : o.status === 'REJECTED' ? 'error' : 'warning'}>{o.status}</Badge></TableCell>
                            <TableCell>
                              {o.status === 'PENDING' && (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" className="text-success" onClick={() => handleOvertimeAction(o.id, 'APPROVED')} loading={overtimeActionId === o.id}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-error" onClick={() => handleOvertimeAction(o.id, 'REJECTED')}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <Modal open={overtimeModal} onClose={() => setOvertimeModal(false)} title="Request Overtime">
                    <div className="space-y-4">
                      <Input label="Date" type="date" value={overtimeForm.date} onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })} />
                      <Input label="Hours" type="number" value={String(overtimeForm.hours)} onChange={(e) => setOvertimeForm({ ...overtimeForm, hours: Number(e.target.value) })} />
                      <Input label="Reason" value={overtimeForm.reason} onChange={(e) => setOvertimeForm({ ...overtimeForm, reason: e.target.value })} />
                      <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setOvertimeModal(false)}>Cancel</Button>
                        <Button onClick={async () => { await api.post('/payroll/overtime', overtimeForm); setOvertimeModal(false); loadData(); }}>Submit</Button>
                      </div>
                    </div>
                  </Modal>
                </Card>
              </div>
            )}

            {tab === 'disputes' && (
              <div className="pt-4">
                <Card>
                  <CardHeader><CardTitle>Disputes & Exceptions</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {incompletePunches.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-warning" /><p className="text-sm font-medium text-text">{incompletePunches.length} Incomplete Punch(es) Need Resolution</p></div>
                        <Table>
                          <TableHeader>
                            <TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Actions</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {incompletePunches.map((p: any) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium text-text">{p.user?.firstName} {p.user?.lastName}</TableCell>
                                <TableCell className="text-sm">{new Date(p.date).toLocaleDateString()}</TableCell>
                                <TableCell><Badge variant="warning">Incomplete</Badge></TableCell>
                                <TableCell>
                                  <div className="flex gap-2 items-center">
                                    <Select value={resolvePunchId === p.id ? resolvePunchResolution : 'FULL_DAY'}
                                      onChange={(e) => { setResolvePunchId(p.id); setResolvePunchResolution(e.target.value); }}
                                      options={[
                                        { value: 'FULL_DAY', label: 'Full Day' },
                                        { value: 'HALF_DAY', label: 'Half Day' },
                                        { value: 'ABSENT', label: 'Absent' },
                                      ]} />
                                    <Button size="sm" variant="primary"
                                      onClick={async () => {
                                        await api.put('/payroll/exceptions/incomplete-punches/' + p.id + '/resolve', {
                                          resolution: resolvePunchId === p.id ? resolvePunchResolution : 'FULL_DAY',
                                          checkoutTime: resolvePunchId === p.id ? resolvePunchCheckout || undefined : undefined,
                                        });
                                        loadData();
                                      }}>Resolve</Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-text mb-3">Disputes</p>
                      <Table>
                        <TableHeader>
                          <TableRow><TableHead>Employee</TableHead><TableHead>Target</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                          {disputes.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-text-tertiary py-8">No disputes</TableCell></TableRow>
                          ) : disputes.map((d: any) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-medium text-text">{d.user?.firstName} {d.user?.lastName}</TableCell>
                              <TableCell className="text-sm">{d.payslip ? 'Payslip ' + months[d.payslip.month - 1] + ' ' + d.payslip.year : d.attendance ? 'Attendance' : '-'}</TableCell>
                              <TableCell className="text-sm text-text-secondary">{d.reason}</TableCell>
                              <TableCell><Badge variant={d.status === 'RESOLVED' ? 'success' : d.status === 'REJECTED' ? 'error' : 'warning'}>{d.status}</Badge></TableCell>
                              <TableCell>
                                {d.status === 'PENDING' && (
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="text-success" onClick={() => { setResolveDisputeId(d.id); setResolveDisputeStatus('RESOLVED'); }}><CheckCircle className="h-4 w-4" /></Button>
                                    <Button size="sm" variant="ghost" className="text-error" onClick={() => { setResolveDisputeId(d.id); setResolveDisputeStatus('REJECTED'); }}><XCircle className="h-4 w-4" /></Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Modal open={!!resolveDisputeId} onClose={() => setResolveDisputeId('')} title={resolveDisputeStatus === 'RESOLVED' ? 'Resolve Dispute' : 'Reject Dispute'}>
                      <div className="space-y-4">
                        <Input label="Resolution Note" value={resolveDisputeResolution} onChange={(e) => setResolveDisputeResolution(e.target.value)} />
                        <div className="flex justify-end gap-3">
                          <Button variant="secondary" onClick={() => setResolveDisputeId('')}>Cancel</Button>
                          <Button onClick={handleResolveDispute} loading={resolveDisputeLoading}>Confirm</Button>
                        </div>
                      </div>
                    </Modal>
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'settings' && (
              <div className="pt-4">
                <Card>
                  <CardHeader><CardTitle>Payroll Configuration</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Select label="Payroll Mode" value={settingsForm.payrollMode}
                        onChange={(e) => setSettingsForm({ ...settingsForm, payrollMode: e.target.value })}
                        options={[
                          { value: 'SIMPLE', label: 'Simple (status-based, no time math)' },
                          { value: 'STRICT', label: 'Strict (exact check-in/out hours)' },
                        ]} />
                      <Input label="Currency" value={settingsForm.currency} onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })} placeholder="INR, USD" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Standard Work Hours/Day" type="number" value={String(settingsForm.standardWorkHours)} onChange={(e) => setSettingsForm({ ...settingsForm, standardWorkHours: Number(e.target.value) })} />
                      <Input label="Standard Work Days/Month" type="number" value={String(settingsForm.standardWorkDays)} onChange={(e) => setSettingsForm({ ...settingsForm, standardWorkDays: Number(e.target.value) })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Select label="Week Start Day" value={String(settingsForm.weekStartDay)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, weekStartDay: Number(e.target.value) })}
                        options={[
                          { value: '0', label: 'Sunday' }, { value: '1', label: 'Monday' }, { value: '6', label: 'Saturday' },
                        ]} />
                    </div>
                    <div className="pt-2">
                      <Button onClick={handleSaveSettings} loading={savingSettings}><Settings className="h-4 w-4" /> Save Settings</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        <Modal open={detailModal} onClose={() => setDetailModal(false)}
          title={'Payslip - ' + (selectedPayslip ? months[selectedPayslip.month - 1] + ' ' + selectedPayslip.year : '')} size="lg">
          {selectedPayslip && (
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <Badge variant="default">{selectedPayslip.payrollMode || 'SIMPLE'} Mode</Badge>
                <Badge variant={selectedPayslip.status === 'FINALIZED' ? 'success' : 'warning'}>{getStatusLabel(selectedPayslip.status)}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-text-tertiary">Basic</p><p className="font-medium text-text">{formatCurrency(selectedPayslip.basic)}</p></div>
                <div><p className="text-sm text-text-tertiary">HRA</p><p className="font-medium text-text">{formatCurrency(selectedPayslip.hra)}</p></div>
              </div>
              {selectedPayslip.allowances && typeof selectedPayslip.allowances === 'object' && Object.keys(selectedPayslip.allowances).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text mb-2">Allowances</p>
                  {Object.entries(selectedPayslip.allowances as Record<string, number>).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-1"><span className="text-text-secondary">{k}</span><span className="text-text">{formatCurrency(v)}</span></div>
                  ))}
                </div>
              )}
              {selectedPayslip.shortHours > 0 && (
                <div className="flex justify-between text-sm py-1 border-t border-border pt-2">
                  <span className="text-text-secondary">Short Hours ({selectedPayslip.shortHours}h)</span>
                  <span className="text-text text-error">-{formatCurrency(selectedPayslip.shortHours * (selectedPayslip.basic / 22 / 8))}</span>
                </div>
              )}
              {selectedPayslip.overtimeHours > 0 && (
                <div className="flex justify-between text-sm py-1">
                  <span className="text-text-secondary">Approved Overtime ({selectedPayslip.overtimeHours}h)</span>
                  <span className="text-text text-success">+{formatCurrency(selectedPayslip.overtimePay)}</span>
                </div>
              )}
              {selectedPayslip.deductions && typeof selectedPayslip.deductions === 'object' && Object.keys(selectedPayslip.deductions).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text mb-2">Deductions</p>
                  {Object.entries(selectedPayslip.deductions as Record<string, number>).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-1"><span className="text-text-secondary">{k}</span><span className="text-text text-error">{formatCurrency(v)}</span></div>
                  ))}
                </div>
              )}
              {selectedPayslip.latePenalties && selectedPayslip.latePenalties.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text mb-2">Late Penalties</p>
                  {selectedPayslip.latePenalties.map((pen: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1"><span className="text-text-secondary">{new Date(pen.date).toLocaleDateString()}</span><span className="text-text text-error">{formatCurrency(pen.amount)}</span></div>
                  ))}
                </div>
              )}
              <div className="border-t border-border pt-4 mt-4 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-text-secondary">Gross Pay</span><span className="font-medium text-text">{formatCurrency(selectedPayslip.grossPay)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-secondary">Total Deductions</span><span className="font-medium text-error">{formatCurrency(selectedPayslip.totalDeductions)}</span></div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border"><span className="text-text">Net Pay</span><span className="text-text">{formatCurrency(selectedPayslip.netPay)}</span></div>
              </div>
              {selectedPayslip.isLocked && (
                <Button className="w-full" onClick={() => handleDownload(selectedPayslip.id)}>
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}