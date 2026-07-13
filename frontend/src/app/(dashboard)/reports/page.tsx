'use client';

import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { BarChart3, Download, TrendingUp, Users, Calendar } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div>
      <Topbar title="Reports & Analytics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Headcount', value: '24', change: '+3 this month' },
            { icon: TrendingUp, label: 'Attendance Rate', value: '94%', change: '+2% vs last month' },
            { icon: Calendar, label: 'Avg Leave Days', value: '2.4', change: 'Per employee this month' },
            { icon: BarChart3, label: 'Late Instances', value: '12', change: 'This month' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">{stat.label}</p>
                    <p className="text-2xl font-bold text-text mt-1">{stat.value}</p>
                    <p className="text-xs text-text-tertiary mt-1">{stat.change}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-brand-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Export Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="secondary" className="justify-start">
                <Download className="h-4 w-4" /> Attendance Report
              </Button>
              <Button variant="secondary" className="justify-start">
                <Download className="h-4 w-4" /> Leave Report
              </Button>
              <Button variant="secondary" className="justify-start">
                <Download className="h-4 w-4" /> Payroll Summary
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Coming Soon</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-text-tertiary">
              Advanced reports with charts, headcount trends, attrition analysis, diversity metrics, and exportable PDF/CSV reports are being developed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
