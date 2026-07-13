'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { Topbar } from '@/components/layout/topbar';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const today = new Date();

  useEffect(() => {
    loadEvents();
  }, [year, month]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<any[]>(`/calendar/events?year=${year}&month=${month}`);
      setEvents(data || []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  const prevMonth = () => setDate(new Date(year, month - 2, 1));
  const nextMonth = () => setDate(new Date(year, month, 1));
  const goToday = () => setDate(new Date());

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();

  const eventMap = new Map<string, any[]>();
  events.forEach(e => {
    const existing = eventMap.get(e.date) || [];
    existing.push(e);
    eventMap.set(e.date, existing);
  });

  const getStatusColor = (event: any) => {
    if (event.type === 'holiday') return 'bg-status-warning-bg text-status-warning border-status-warning';
    if (event.type === 'leave') return 'bg-status-info-bg text-status-info border-status-info';
    return 'bg-surface-secondary text-text-secondary';
  };

  const getStatusName = (event: any) => {
    if (event.type === 'holiday') return 'Holiday';
    return event.leaveType?.replace(/_/g, ' ');
  };

  const cells: any[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: daysInPrev - firstDay + 1 + i, empty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, date: dateStr, events: eventMap.get(dateStr) || [] });
  }
  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - daysInMonth - firstDay + 1;
    cells.push({ day: nextDay, empty: true });
  }

  const weeks: any[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const selectedEvents = selectedDay
    ? events.filter(e => {
        const d = parseInt(e.date.split('-')[2]);
        return d === selectedDay && e.date.startsWith(`${year}-${String(month).padStart(2, '0')}`);
      })
    : [];

  return (
    <div>
      <Topbar title="Calendar" />
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="text-xl font-semibold text-text">{MONTHS[month - 1]} {year}</h2>
                <Button variant="secondary" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <Button variant="secondary" size="sm" onClick={goToday}>Today</Button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {DAYS.map(d => (
                <div key={d} className="bg-surface-secondary p-2 text-center text-xs font-semibold text-text-tertiary uppercase">
                  {d}
                </div>
              ))}
              {weeks.flat().map((cell, i) => {
                const isToday = cell.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isSelected = selectedDay === cell.day && !cell.empty;
                return (
                  <div
                    key={i}
                    onClick={() => !cell.empty && setSelectedDay(cell.day === selectedDay ? null : cell.day)}
                    className={`min-h-24 bg-surface p-1.5 cursor-pointer transition-colors hover:bg-surface-tertiary ${cell.empty ? 'bg-surface-secondary/50 cursor-default hover:bg-surface-secondary/50' : ''} ${isSelected ? 'ring-2 ring-brand-500 ring-inset' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-600 text-white' : 'text-text-secondary'}`}>
                      {cell.day}
                    </div>
                    <div className="space-y-0.5">
                      {cell.events?.slice(0, 2).map((event: any, ei: number) => (
                        <div key={ei} className={`text-[10px] px-1 py-0.5 rounded truncate border ${getStatusColor(event)}`}>
                          {event.title}
                        </div>
                      ))}
                      {cell.events?.length > 2 && (
                        <div className="text-[10px] text-text-tertiary px-1">+{cell.events.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedDay && selectedEvents.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-text mb-3">
                Events for {MONTHS[month - 1]} {selectedDay}, {year}
              </h3>
              <div className="space-y-2">
                {selectedEvents.map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${event.type === 'holiday' ? 'bg-status-warning-bg text-status-warning' : 'bg-status-info-bg text-status-info'}`}>
                      {event.type === 'holiday' ? 'H' : 'L'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{event.title}</p>
                      <p className="text-xs text-text-tertiary">{getStatusName(event)}</p>
                    </div>
                    <Badge variant={event.type === 'holiday' ? 'warning' : 'info'}>
                      {event.type === 'holiday' ? 'Holiday' : 'Leave'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedDay && selectedEvents.length === 0 && (
          <Card>
            <CardContent className="p-4 text-center text-text-tertiary text-sm">
              No events on {MONTHS[month - 1]} {selectedDay}, {year}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
