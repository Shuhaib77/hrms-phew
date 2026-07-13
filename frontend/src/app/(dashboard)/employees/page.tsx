'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Badge, Input, Select, Skeleton, Avatar, Modal } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { formatDate, formatCurrency, getStatusLabel } from '@/lib/utils';
import { Search, Users, Plus, DollarSign, X } from 'lucide-react';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ departmentId: '', role: '' });
  const [page, setPage] = useState(1);

  // Add employee modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    role: 'EMPLOYEE', departmentId: '', managerId: '',
    designation: '', phone: '',
    basic: 0, hra: 0,
    allowanceKeys: [] as string[], allowanceVals: [] as number[],
    deductionKeys: [] as string[], deductionVals: [] as number[],
  });

  useEffect(() => {
    loadEmployees();
  }, [search, filters, page]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filters.departmentId) params.set('departmentId', filters.departmentId);
      if (filters.role) params.set('role', filters.role);
      params.set('page', String(page));
      params.set('limit', '16');
      const res = await api.get<any>(`/employees?${params}`);
      setEmployees(res.data || []);
      setPagination(res.pagination);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const openAddModal = async () => {
    setAddError('');
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '', managerId: '', designation: '', phone: '', basic: 0, hra: 0, allowanceKeys: [], allowanceVals: [], deductionKeys: [], deductionVals: [] });
    setAddModalOpen(true);
    try {
      const all = await api.get<any[]>('/employees?limit=100').catch(() => ({ data: [] as any[] }));
      const emps = all.data || [];
      const deptMap = new Map<string, string>();
      emps.forEach((e: any) => { if (e.department?.name && e.departmentId) deptMap.set(e.departmentId, e.department.name); });
      setDepartments(Array.from(deptMap, ([id, name]) => ({ id, name })));
      setManagers(emps.filter((e: any) => ['ADMIN', 'HR_MANAGER', 'MANAGER'].includes(e.role)));
    } catch {}
  };

  const handleAdd = async () => {
    setAdding(true);
    setAddError('');
    try {
      const res = await api.post<any>('/auth/register', form);
      const newUserId = res.data?.user?.id || res.data?.id;
      if (newUserId && (form.basic > 0 || form.hra > 0)) {
        const allowances: Record<string, number> = {};
        form.allowanceKeys.forEach((k, i) => { if (k) allowances[k] = form.allowanceVals[i] || 0; });
        const deductions: Record<string, number> = {};
        form.deductionKeys.forEach((k, i) => { if (k) deductions[k] = form.deductionVals[i] || 0; });
        await api.put('/payroll/salary-structure', {
          userId: newUserId,
          basic: form.basic || 0,
          hra: form.hra || 0,
          allowances,
          deductions,
        });
      }
      setAddModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create employee');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <Topbar title="Employees" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.role}
              onChange={(e) => { setFilters({ ...filters, role: e.target.value }); setPage(1); }}
              options={[
                { value: '', label: 'All Roles' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'HR_MANAGER', label: 'HR Manager' },
                { value: 'MANAGER', label: 'Manager' },
                { value: 'EMPLOYEE', label: 'Employee' },
              ]}
              placeholder="All Roles"
            />
          </div>
          <Button onClick={openAddModal}><Plus className="h-4 w-4" /> Add Employee</Button>
        </div>

        {/* Add Employee Modal */}
        <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Employee" size="lg">
          <div className="space-y-4">
            {addError && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error">{addError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" required />
              <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" required />
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 chars" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={[
                  { value: 'EMPLOYEE', label: 'Employee' },
                  { value: 'MANAGER', label: 'Manager' },
                  { value: 'HR_MANAGER', label: 'HR Manager' },
                ]}
              />
              <Select
                label="Department"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                options={[{ value: '', label: 'No Department' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Software Engineer" />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
            </div>
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-text-tertiary" />
                <p className="text-sm font-medium text-text">Salary Structure (optional — can set later)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Basic Pay" type="number" value={String(form.basic)} onChange={(e) => setForm({ ...form, basic: Number(e.target.value) })} />
                <Input label="HRA" type="number" value={String(form.hra)} onChange={(e) => setForm({ ...form, hra: Number(e.target.value) })} />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-text-secondary">Allowances</p>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setForm({ ...form, allowanceKeys: [...form.allowanceKeys, ''], allowanceVals: [...form.allowanceVals, 0] })}>
                    + Add
                  </Button>
                </div>
                {form.allowanceKeys.map((_, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input placeholder="Name" value={form.allowanceKeys[i]} onChange={(e) => { const k = [...form.allowanceKeys]; k[i] = e.target.value; setForm({ ...form, allowanceKeys: k }); }} />
                    <Input placeholder="Amount" type="number" value={String(form.allowanceVals[i])} onChange={(e) => { const v = [...form.allowanceVals]; v[i] = Number(e.target.value); setForm({ ...form, allowanceVals: v }); }} />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-text-secondary">Deductions</p>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setForm({ ...form, deductionKeys: [...form.deductionKeys, ''], deductionVals: [...form.deductionVals, 0] })}>
                    + Add
                  </Button>
                </div>
                {form.deductionKeys.map((_, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input placeholder="Name" value={form.deductionKeys[i]} onChange={(e) => { const k = [...form.deductionKeys]; k[i] = e.target.value; setForm({ ...form, deductionKeys: k }); }} />
                    <Input placeholder="Amount" type="number" value={String(form.deductionVals[i])} onChange={(e) => { const v = [...form.deductionVals]; v[i] = Number(e.target.value); setForm({ ...form, deductionVals: v }); }} />
                  </div>
                ))}
              </div>
            </div>
            <Select
              label="Manager"
              value={form.managerId}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
              options={[{ value: '', label: 'No Manager' }, ...managers.map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName} (${m.role})` }))]}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} loading={adding} disabled={!form.firstName || !form.lastName || !form.email || !form.password}>
                <Plus className="h-4 w-4" /> Create Employee
              </Button>
            </div>
          </div>
        </Modal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : employees.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-text-tertiary mb-3" />
              <p className="text-text-secondary font-medium">No employees found</p>
              <p className="text-text-tertiary text-sm">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((emp: any) => (
              <Card key={emp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/employees/${emp.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar firstName={emp.firstName} lastName={emp.lastName} avatarUrl={emp.avatar} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-text truncate">{emp.firstName} {emp.lastName}</h3>
                      <p className="text-sm text-text-secondary truncate">{emp.designation || 'No designation'}</p>
                      <p className="text-xs text-text-tertiary mt-1">{emp.employeeId}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="default">{emp.department?.name || 'No Dept'}</Badge>
                        <Badge variant={emp.isActive ? 'success' : 'error'}>{emp.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pagination && (
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} employees)</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
