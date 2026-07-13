'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Select, Modal, Skeleton, Avatar, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, getStatusLabel } from '@/lib/utils';
import { Trophy, Star, Users, TrendingUp, Award } from 'lucide-react';

export default function PerformancePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'MANAGER';
  const [loading, setLoading] = useState(true);
  const [eom, setEom] = useState<any>(null);
  const [eomHistory, setEomHistory] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSelectEom, setShowSelectEom] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [eomData, setEomData] = useState({ userId: '', reason: '' });
  const [reviewData, setReviewData] = useState({ userId: '', cycle: '', quality: 5, timeliness: 5, collaboration: 5, ownership: 5, feedback: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [e, h, s] = await Promise.all([
        api.get<any>('/performance/eom').catch(() => ({ data: null })),
        api.get<any[]>('/performance/eom/history').catch(() => ({ data: [] as any[] })),
        api.get<any[]>('/performance/eom/suggestions').catch(() => ({ data: [] as any[] })),
      ]);
      setEom(e.data);
      setEomHistory(h.data || []);
      setSuggestions(s.data || []);

      if (user) {
        api.get<any[]>(`/performance/reviews/${user.id}`).then(r => setReviews(r.data)).catch(() => {});
      }
      if (isAdmin) {
        api.get<any>('/employees?limit=100').then(r => setEmployees(r.data || [])).catch(() => {});
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleSelectEom = async () => {
    try {
      const now = new Date();
      await api.post('/performance/eom/select', {
        userId: eomData.userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        reason: eomData.reason,
      });
      setShowSelectEom(false);
      setEomData({ userId: '', reason: '' });
      loadData();
    } catch { /* ignore */ }
  };

  const handleCreateReview = async () => {
    try {
      await api.post('/performance/reviews', reviewData);
      setShowReviewModal(false);
      setReviewData({ userId: '', cycle: '', quality: 5, timeliness: 5, collaboration: 5, ownership: 5, feedback: '' });
    } catch { /* ignore */ }
  };

  return (
    <div>
      <Topbar title="Performance" />
      <div className="p-6 space-y-6">
        {/* EOM Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warning" />
                Employee of the Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-60 mt-1" /></div>
                </div>
              ) : eom ? (
                <div className="flex items-start gap-4">
                  <Avatar firstName={eom.user?.firstName || ''} lastName={eom.user?.lastName || ''} size="lg" className="h-16 w-16" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-text">{eom.user?.firstName} {eom.user?.lastName}</h3>
                      <Badge variant="brand">{eom.user?.designation || 'Employee'}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary mt-2">{eom.reason}</p>
                    <p className="text-xs text-text-tertiary mt-2">Selected by {eom.selectedBy?.firstName} {eom.selectedBy?.lastName}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary">No EOM selected for this month</p>
                  {isAdmin && <Button size="sm" className="mt-3" onClick={() => setShowSelectEom(true)}>Select Employee</Button>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggestions */}
          {isAdmin && suggestions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Top Candidates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.slice(0, 3).map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <Avatar firstName={s.firstName} lastName={s.lastName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-text-tertiary">Avg: {s.averageScore}/10</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { setEomData({ userId: s.id, reason: '' }); setShowSelectEom(true); }}>Select</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reviews */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-warning" /> My Performance Reviews</CardTitle>
            {isAdmin && <Button size="sm" onClick={() => setShowReviewModal(true)}>New Review</Button>}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-8">No performance reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-text">{r.cycle}</p>
                          <p className="text-xs text-text-tertiary">by {r.reviewer?.firstName} {r.reviewer?.lastName}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-warning text-warning" />
                          <span className="font-bold text-lg text-text">{r.overallScore.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Quality', value: r.quality },
                          { label: 'Timeliness', value: r.timeliness },
                          { label: 'Collaboration', value: r.collaboration },
                          { label: 'Ownership', value: r.ownership },
                        ].map((m) => (
                          <div key={m.label} className="text-center p-2 rounded-lg bg-surface-secondary">
                            <p className="text-lg font-semibold text-text">{m.value}/10</p>
                            <p className="text-xs text-text-tertiary">{m.label}</p>
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

        {/* EOM History */}
        <Card>
          <CardHeader><CardTitle>EOM History</CardTitle></CardHeader>
          <CardContent>
            {eomHistory.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">No history yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {eomHistory.map((e: any) => {
                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  return (
                    <Card key={e.id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar firstName={e.user?.firstName || ''} lastName={e.user?.lastName || ''} size="md" />
                        <div>
                          <p className="text-sm font-medium text-text">{e.user?.firstName} {e.user?.lastName}</p>
                          <p className="text-xs text-text-tertiary">{months[e.month - 1]} {e.year}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Select EOM Modal */}
        <Modal open={showSelectEom} onClose={() => setShowSelectEom(false)} title="Select Employee of the Month">
          <div className="space-y-4">
            <Select
              label="Employee"
              value={eomData.userId}
              onChange={(e) => setEomData({ ...eomData, userId: e.target.value })}
              options={employees.map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
              placeholder="Select employee"
            />
            <Input label="Reason / Citation" value={eomData.reason} onChange={(e) => setEomData({ ...eomData, reason: e.target.value })} placeholder="Why this employee?" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowSelectEom(false)}>Cancel</Button>
              <Button onClick={handleSelectEom} disabled={!eomData.userId}>Confirm Selection</Button>
            </div>
          </div>
        </Modal>

        {/* Create Review Modal */}
        <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="New Performance Review" size="lg">
          <div className="space-y-4">
            <Select
              label="Employee"
              value={reviewData.userId}
              onChange={(e) => setReviewData({ ...reviewData, userId: e.target.value })}
              options={employees.map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
              placeholder="Select employee"
            />
            <Input label="Review Cycle" value={reviewData.cycle} onChange={(e) => setReviewData({ ...reviewData, cycle: e.target.value })} placeholder="e.g., Q4-2024" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-text mb-1">Quality (0-10)</p>
                <input type="range" min="0" max="10" value={reviewData.quality} onChange={(e) => setReviewData({ ...reviewData, quality: parseInt(e.target.value) })} className="w-full" />
                <p className="text-sm text-text-secondary">{reviewData.quality}/10</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text mb-1">Timeliness (0-10)</p>
                <input type="range" min="0" max="10" value={reviewData.timeliness} onChange={(e) => setReviewData({ ...reviewData, timeliness: parseInt(e.target.value) })} className="w-full" />
                <p className="text-sm text-text-secondary">{reviewData.timeliness}/10</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text mb-1">Collaboration (0-10)</p>
                <input type="range" min="0" max="10" value={reviewData.collaboration} onChange={(e) => setReviewData({ ...reviewData, collaboration: parseInt(e.target.value) })} className="w-full" />
                <p className="text-sm text-text-secondary">{reviewData.collaboration}/10</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text mb-1">Ownership (0-10)</p>
                <input type="range" min="0" max="10" value={reviewData.ownership} onChange={(e) => setReviewData({ ...reviewData, ownership: parseInt(e.target.value) })} className="w-full" />
                <p className="text-sm text-text-secondary">{reviewData.ownership}/10</p>
              </div>
            </div>
            <Input label="Feedback" value={reviewData.feedback} onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })} placeholder="Optional feedback" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
              <Button onClick={handleCreateReview} disabled={!reviewData.userId || !reviewData.cycle}>Submit Review</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
