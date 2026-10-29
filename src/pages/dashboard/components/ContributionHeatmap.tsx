import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { DailyCommitActivity } from '../../../types/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';

interface ContributionHeatmapProps {
  activities: DailyCommitActivity[];
  timeframeLabel?: string;
}

export function ContributionHeatmap({
  activities,
  timeframeLabel = 'Aktivitas commit 12 minggu terakhir',
}: ContributionHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Mengelompokkan aktivitas ke dalam minggu (7 hari per kolom)
  const weeks: DailyCommitActivity[][] = [];
  let currentWeek: DailyCommitActivity[] = [];

  activities.forEach((item, index) => {
    currentWeek.push(item);
    if (currentWeek.length === 7 || index === activities.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Warna intensitas aktivitas (Level 0 - 4)
  const levelColorMap: Record<number, string> = {
    0: 'bg-app-secondary/60 hover:ring-1 hover:ring-app-text-secondary/40',
    1: 'bg-emerald-500/30 hover:ring-1 hover:ring-emerald-400',
    2: 'bg-emerald-500/55 hover:ring-1 hover:ring-emerald-400',
    3: 'bg-emerald-500/80 hover:ring-1 hover:ring-emerald-300',
    4: 'bg-emerald-400 hover:ring-1 hover:ring-emerald-200',
  };

  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const formatDateIndo = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const totalCommitsInPeriod = activities.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-app-accent-secondary" />
          <CardTitle className="text-sm">Aktivitas Commit Berdasarkan Waktu</CardTitle>
        </div>
        <span className="text-xs text-app-text-secondary font-mono">
          {totalCommitsInPeriod} commit tercatat
        </span>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Label Waktu & Keterangan */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-app-text-secondary">
          <span>{timeframeLabel}</span>
          <span className="text-[11px] text-app-text-secondary/80">
            *Menampilkan frekuensi commit per hari, bukan evaluasi kualitas
          </span>
        </div>

        {/* Heatmap Grid Wrapper dengan scroll horizontal halus jika layar kecil */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[620px] select-none relative">
            <div className="flex gap-1.5 items-start">
              {/* Day Labels Column */}
              <div className="grid grid-rows-7 gap-1.5 pr-2 text-[10px] text-app-text-secondary font-medium leading-[14px]">
                {dayLabels.map((day, idx) => (
                  <span
                    key={day}
                    className={cn(
                      'h-3.5 flex items-center justify-end',
                      idx % 2 === 0 ? 'opacity-0' : 'opacity-80'
                    )}
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Weeks Grid Columns */}
              <div className="flex gap-1.5 flex-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-rows-7 gap-1.5">
                    {week.map((day) => (
                      <button
                        key={day.date}
                        type="button"
                        aria-label={`${formatDateIndo(day.date)}: ${day.count} commit`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            date: day.date,
                            count: day.count,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            date: day.date,
                            count: day.count,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onBlur={() => setHoveredDay(null)}
                        className={cn(
                          'w-3.5 h-3.5 rounded-[2px] transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-app-accent-primary',
                          levelColorMap[day.level]
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Tooltip */}
        {hoveredDay && (
          <div
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-md bg-app-card text-app-text-primary text-[11px] font-medium shadow-xl border border-app-border whitespace-nowrap animate-fadeIn"
            style={{
              left: `${hoveredDay.x}px`,
              top: `${hoveredDay.y}px`,
            }}
          >
            <div className="font-semibold">
              {hoveredDay.count === 0
                ? 'Tidak ada commit'
                : `${hoveredDay.count} commit`}
            </div>
            <div className="text-[10px] text-app-text-secondary">
              {formatDateIndo(hoveredDay.date)}
            </div>
          </div>
        )}

        {/* Legend Tingkat Aktivitas */}
        <div className="flex items-center justify-between text-xs text-app-text-secondary pt-2 border-t border-app-border">
          <span className="text-[11px]">Intensitas commit per tanggal</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-app-text-secondary">Kurang</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-[2px] bg-app-secondary/60 border border-app-border" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-500/30" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-500/55" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-500/80" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-400" />
            </div>
            <span className="text-[11px] text-app-text-secondary">Lebih</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
