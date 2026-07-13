'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Modal, Skeleton } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { Building2, Plus, MapPin, Edit2, ToggleLeft, ToggleRight, Trash2, Users, Wifi } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  isWifiVerificationEnabled: boolean;
  wifiBssids: string[];
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface LocationForm {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radius: string;
  isActive: boolean;
  isWifiVerificationEnabled: boolean;
  wifiBssids: string[];
}

const emptyForm: LocationForm = { name: '', address: '', latitude: '', longitude: '', radius: '100', isActive: true, isWifiVerificationEnabled: false, wifiBssids: [] };

export default function LocationsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Location[]>('/locations');
      setLocations(data || []);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      address: loc.address,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
      radius: String(loc.radius),
      isActive: loc.isActive,
      isWifiVerificationEnabled: loc.isWifiVerificationEnabled,
      wifiBssids: loc.wifiBssids || [],
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.address.trim()) { setError('Address is required'); return; }
    if (!form.latitude || isNaN(Number(form.latitude))) { setError('Valid latitude is required'); return; }
    if (!form.longitude || isNaN(Number(form.longitude))) { setError('Valid longitude is required'); return; }
    if (!form.radius || isNaN(Number(form.radius)) || Number(form.radius) <= 0) { setError('Valid radius is required'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radius: Number(form.radius),
        isActive: form.isActive,
        isWifiVerificationEnabled: form.isWifiVerificationEnabled,
        wifiBssids: form.wifiBssids.filter(b => /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(b)),
      };

      if (editingId) {
        await api.put(`/locations/${editingId}`, payload);
      } else {
        await api.post('/locations', payload);
      }

      setModalOpen(false);
      loadLocations();
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (loc: Location) => {
    try {
      await api.put(`/locations/${loc.id}`, { isActive: !loc.isActive });
      loadLocations();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      await api.delete(`/locations/${id}`);
      loadLocations();
    } catch { /* ignore */ }
  };

  if (!isAdmin) {
    return (
      <div>
        <Topbar title="Locations" />
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-text">Access Restricted</h3>
              <p className="text-sm text-text-secondary mt-2">You do not have permission to manage locations.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Location Management" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text">Locations</h2>
            <p className="text-sm text-text-secondary mt-1">Manage office and branch locations for geofence attendance.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Location
          </Button>
        </div>

        {/* Location Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-text">No locations yet</h3>
              <p className="text-sm text-text-secondary mt-2 mb-4">Create your first location to enable geofence-based attendance tracking.</p>
              <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Location</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <Card key={loc.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${loc.isActive ? 'bg-brand-50' : 'bg-surface-tertiary'}`}>
                        <Building2 className={`h-5 w-5 ${loc.isActive ? 'text-brand-600' : 'text-text-tertiary'}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text">{loc.name}</h3>
                        <Badge variant={loc.isActive ? 'success' : 'default'}>
                          {loc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-text-secondary mb-2 line-clamp-2">{loc.address}</p>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Radius: {loc.radius}m</span>
                    </div>
                    {loc.isWifiVerificationEnabled && (
                      <div className="flex items-center gap-2 text-xs text-text-tertiary">
                        <Wifi className="h-3.5 w-3.5 text-brand-600" />
                        <span>Wi-Fi verification: {loc.wifiBssids?.length || 0} BSSID(s)</span>
                      </div>
                    )}
                    {loc.employeeCount !== undefined && (
                      <div className="flex items-center gap-2 text-xs text-text-tertiary">
                        <Users className="h-3.5 w-3.5" />
                        <span>{loc.employeeCount} employees</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(loc)}>
                      <Edit2 className="h-4 w-4" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleToggleActive(loc)}>
                      {loc.isActive ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4 text-text-tertiary" />}
                      {loc.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-error hover:text-error" onClick={() => handleDelete(loc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Location' : 'Add Location'} size="md">
          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error">
                {error}
              </div>
            )}

            <Input
              label="Location Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., HQ Office"
            />

            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g., 123 Main St, City"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="e.g., 12.9716"
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                placeholder="e.g., 77.5946"
              />
            </div>

            <Input
              label="Geofence Radius (meters)"
              type="number"
              min="10"
              max="10000"
              value={form.radius}
              onChange={(e) => setForm({ ...form, radius: e.target.value })}
              placeholder="e.g., 100"
            />

            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-text-tertiary" />
                  <label className="text-sm font-medium text-text">Wi-Fi BSSID Verification</label>
                </div>
                <button type="button" onClick={() => setForm({ ...form, isWifiVerificationEnabled: !form.isWifiVerificationEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isWifiVerificationEnabled ? 'bg-brand-600' : 'bg-surface-tertiary'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isWifiVerificationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {form.isWifiVerificationEnabled && (
                <div className="space-y-2">
                  <p className="text-xs text-text-tertiary">Add office router BSSIDs (MAC addresses). Format: <code>XX:XX:XX:XX:XX:XX</code></p>
                  {form.wifiBssids.map((bssid, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="AA:BB:CC:DD:EE:FF" value={bssid}
                        onChange={(e) => { const b = [...form.wifiBssids]; b[i] = e.target.value; setForm({ ...form, wifiBssids: b }); }} />
                      <Button size="sm" variant="ghost" className="text-error shrink-0" onClick={() => {
                        const b = form.wifiBssids.filter((_, idx) => idx !== i);
                        setForm({ ...form, wifiBssids: b });
                      }}>X</Button>
                    </div>
                  ))}
                  <Button size="sm" variant="secondary" onClick={() => setForm({ ...form, wifiBssids: [...form.wifiBssids, ''] })}>
                    <Plus className="h-3 w-3" /> Add BSSID
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-text">Active</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-success' : 'bg-surface-tertiary'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>
                {editingId ? 'Update Location' : 'Create Location'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
