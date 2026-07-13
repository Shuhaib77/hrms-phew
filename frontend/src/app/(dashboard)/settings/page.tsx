'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Skeleton } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, getStatusLabel } from '@/lib/utils';
import { Save, Shield, Clock, MapPin, Camera, DollarSign, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [policy, setPolicy] = useState({
    shiftStartTime: '09:00',
    gracePeriodMinutes: 15,
    allowedLatesPerWeek: 3,
    allowedLatesPerMonth: 10,
    penaltyType: 'flat',
    penaltyAmount: 100,
    penaltyPercentage: 5,
    isGeofencingEnabled: true,
    isWifiVerificationEnabled: false,
    isPhotoRequired: true,
    enableEscalatingPenalties: false,
    escalatingTier2After: 6,
    escalatingTier2Amount: 250,
    escalatingTier3After: 10,
    escalatingTier3Amount: 500,
  });

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const { data: p } = await api.get<any>('/settings/attendance-policy');
      if (p) {
        setPolicy({
          shiftStartTime: p.shiftStartTime || '09:00',
          gracePeriodMinutes: p.gracePeriodMinutes ?? 15,
          allowedLatesPerWeek: p.allowedLatesPerWeek ?? 3,
          allowedLatesPerMonth: p.allowedLatesPerMonth ?? 10,
          penaltyType: p.penaltyType || 'flat',
          penaltyAmount: p.penaltyAmount ?? 100,
          penaltyPercentage: p.penaltyPercentage ? p.penaltyPercentage * 100 : 5,
          isGeofencingEnabled: p.isGeofencingEnabled ?? true,
          isWifiVerificationEnabled: p.isWifiVerificationEnabled ?? false,
          isPhotoRequired: p.isPhotoRequired ?? true,
          enableEscalatingPenalties: p.enableEscalatingPenalties ?? false,
          escalatingTier2After: p.escalatingTier2After ?? 6,
          escalatingTier2Amount: p.escalatingTier2Amount ?? 250,
          escalatingTier3After: p.escalatingTier3After ?? 10,
          escalatingTier3Amount: p.escalatingTier3Amount ?? 500,
        });
      }
    } catch { /* use defaults */ }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/settings/attendance-policy', {
        ...policy,
        penaltyPercentage: policy.penaltyPercentage / 100,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div>
      <Topbar title="Settings" />
      <div className="p-6 space-y-6 max-w-3xl">
        {!isAdmin && (
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary font-medium">Access Restricted</p>
              <p className="text-sm text-text-tertiary">Only administrators can access settings.</p>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Attendance Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-text mb-3">Shift Timing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Shift Start Time"
                      type="time"
                      value={policy.shiftStartTime}
                      onChange={(e) => setPolicy({ ...policy, shiftStartTime: e.target.value })}
                    />
                    <Input
                      label="Grace Period (minutes)"
                      type="number"
                      value={String(policy.gracePeriodMinutes)}
                      onChange={(e) => setPolicy({ ...policy, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-text mb-3">Enforcement</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={policy.isGeofencingEnabled}
                        onChange={(e) => setPolicy({ ...policy, isGeofencingEnabled: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-brand-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-text">Enable Geofencing (GPS)</p>
                        <p className="text-xs text-text-tertiary">Employees must be within location radius to check in</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={policy.isWifiVerificationEnabled}
                        onChange={(e) => setPolicy({ ...policy, isWifiVerificationEnabled: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-brand-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-text">Enable Wi-Fi BSSID Verification</p>
                        <p className="text-xs text-text-tertiary">Check employee is connected to a registered office Wi-Fi router (requires native app)</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={policy.isPhotoRequired}
                        onChange={(e) => setPolicy({ ...policy, isPhotoRequired: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-brand-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-text">Require Photo</p>
                        <p className="text-xs text-text-tertiary">Camera capture is mandatory for check-in</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" /> Late Penalty Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Allowed Lates per Week"
                      type="number"
                      value={String(policy.allowedLatesPerWeek)}
                      onChange={(e) => setPolicy({ ...policy, allowedLatesPerWeek: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      label="Allowed Lates per Month"
                      type="number"
                      value={String(policy.allowedLatesPerMonth)}
                      onChange={(e) => setPolicy({ ...policy, allowedLatesPerMonth: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <Select
                      label="Penalty Type"
                      value={policy.penaltyType}
                      onChange={(e) => setPolicy({ ...policy, penaltyType: e.target.value })}
                      options={[
                        { value: 'flat', label: 'Flat Amount' },
                        { value: 'percentage', label: 'Percentage of Basic' },
                      ]}
                    />
                    {policy.penaltyType === 'flat' ? (
                      <Input
                        label="Penalty Amount ($)"
                        type="number"
                        value={String(policy.penaltyAmount)}
                        onChange={(e) => setPolicy({ ...policy, penaltyAmount: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      <Input
                        label="Penalty Percentage (%)"
                        type="number"
                        value={String(policy.penaltyPercentage)}
                        onChange={(e) => setPolicy({ ...policy, penaltyPercentage: parseInt(e.target.value) || 0 })}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={policy.enableEscalatingPenalties}
                      onChange={(e) => setPolicy({ ...policy, enableEscalatingPenalties: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-brand-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-text">Enable Escalating Penalties</p>
                      <p className="text-xs text-text-tertiary">Higher penalties for repeat offenders</p>
                    </div>
                  </label>

                  {policy.enableEscalatingPenalties && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="p-3 rounded-lg bg-surface-secondary">
                        <p className="text-xs text-text-tertiary mb-1">Tier 2 (after {policy.escalatingTier2After} lates)</p>
                        <Input
                          type="number"
                          value={String(policy.escalatingTier2Amount)}
                          onChange={(e) => setPolicy({ ...policy, escalatingTier2Amount: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="p-3 rounded-lg bg-surface-secondary">
                        <p className="text-xs text-text-tertiary mb-1">Tier 3 (after {policy.escalatingTier3After} lates)</p>
                        <Input
                          type="number"
                          value={String(policy.escalatingTier3Amount)}
                          onChange={(e) => setPolicy({ ...policy, escalatingTier3Amount: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Button onClick={handleSave} loading={saving}>
                    <Save className="h-4 w-4" /> Save Settings
                  </Button>
                  {saved && <span className="text-sm text-success">Settings saved successfully!</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Late Penalty Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-tertiary">
                  Employees who are approaching or have exceeded their allowed late check-ins will appear here.
                  Late penalties are automatically applied to payslips at the end of each pay period.
                </p>
                <div className="mt-4 p-4 rounded-lg bg-warning/5 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text">Policy Active</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {policy.allowedLatesPerMonth} lates allowed per month with {policy.penaltyType === 'flat' ? '$' + policy.penaltyAmount : policy.penaltyPercentage + '%'} penalty per occurrence beyond the threshold.
                        {policy.enableEscalatingPenalties && ` Escalating tiers apply after ${policy.escalatingTier2After} and ${policy.escalatingTier3After} lates.`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
