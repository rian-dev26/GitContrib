import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Calendar, BarChart3, Info } from 'lucide-react';
import { Commit } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

interface ContributorActivityChartProps {
  commits: Commit[];
  isFiltered: boolean;
}

interface TimeBucket {
  period: string; // e.g. "Feb 2024" or "10 Okt"
  yes: number;
  no: number;
  total: number;
}

export function ContributorActivityChart({ commits, isFiltered }: ContributorActivityChartProps) {
  // Olah commit menjadi bucket waktu
  const chartData = useMemo(() => {
    if (!commits || commits.length === 0) return [];

    // Urutkan commit ascending berdasarkan timestamp untuk grafik time-series
    const sorted = [...commits].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Tentukan apakah agregasi per bulan atau per hari berdasarkan rentang waktu
    const firstTime = new Date(sorted[0].timestamp).getTime();
    const lastTime = new Date(sorted[sorted.length - 1].timestamp).getTime();
    const diffDays = Math.ceil((lastTime - firstTime) / (1000 * 60 * 60 * 24));

    // Jika rentang <= 35 hari, kelompokkan per hari atau per 2 hari; jika > 35 hari, kelompokkan per bulan
    const useMonthly = diffDays > 45;

    const map = new Map<string, { label: string; yes: number; no: number; total: number }>();

    sorted.forEach((commit) => {
      const d = new Date(commit.timestamp);
      let key: string;
      let label: string;

      if (useMonthly) {
        // e.g. "2024-02"
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      } else {
        // e.g. "2024-10-24"
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      }

      const existing = map.get(key) || { label, yes: 0, no: 0, total: 0 };
      const isYes = commit.classification?.label === 'YES';
      if (isYes) {
        existing.yes += 1;
      } else {
        existing.no += 1;
      }
      existing.total += 1;
      map.set(key, existing);
    });

    return Array.from(map.values()).map((item): TimeBucket => ({
      period: item.label,
      yes: item.yes,
      no: item.no,
      total: item.total,
    }));
  }, [commits]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-app-accent-primary/10 border border-app-accent-primary/20 flex items-center justify-center text-app-accent-primary">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Aktivitas Commit Berdasarkan Waktu
              </CardTitle>
              <p className="text-xs text-app-text-secondary">
                Distribusi frekuensi commit dan klasifikasi YES / NO sepanjang periode aktif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-app-text-secondary bg-app-secondary/50 px-2.5 py-1 rounded-md border border-app-border">
            <Calendar className="w-3.5 h-3.5 text-app-accent-primary" />
            <span>
              {isFiltered ? 'Sesuai Filter Aktif' : 'Semua Periode (Feb – Okt 2024)'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {chartData.length === 0 ? (
          <div className="py-16 text-center text-xs text-app-text-secondary">
            <BarChart3 className="w-8 h-8 text-app-text-secondary/40 mx-auto mb-2" />
            Tidak ada data commit untuk dirender pada grafik dalam rentang filter saat ini.
          </div>
        ) : (
          <div className="w-full">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barSize={chartData.length > 8 ? 20 : 32}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-app-border"
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    className="text-app-text-secondary"
                    tickLine={false}
                    axisLine={{ stroke: 'currentColor', className: 'text-app-border' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    className="text-app-text-secondary"
                    tickLine={false}
                    axisLine={{ stroke: 'currentColor', className: 'text-app-border' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    formatter={(value) => {
                      if (value === 'yes') return 'Commit YES (Pola Aktif)';
                      if (value === 'no') return 'Commit NO (Pola Minor)';
                      return value;
                    }}
                  />
                  <Bar
                    dataKey="yes"
                    name="yes"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="no"
                    name="no"
                    stackId="a"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-app-border/60 flex items-center justify-between text-[11px] text-app-text-secondary">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-app-accent-primary" />
                Grafik otomatis memperbarui agregasi bila filter tanggal atau pencarian diterapkan.
              </span>
              <span className="font-medium text-app-text-primary">
                Total {commits.length} commit visual
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom Tooltip component
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const yesVal = payload.find((p) => p.name === 'yes')?.value || 0;
  const noVal = payload.find((p) => p.name === 'no')?.value || 0;
  const total = yesVal + noVal;

  return (
    <div className="bg-app-card border border-app-border rounded-lg p-3 shadow-xl text-xs space-y-1.5 min-w-[170px]">
      <p className="font-semibold text-app-text-primary border-b border-app-border/80 pb-1">
        {label}
      </p>
      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Commit YES:
        </span>
        <span className="font-mono font-bold">{yesVal}</span>
      </div>
      <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          Commit NO:
        </span>
        <span className="font-mono font-bold">{noVal}</span>
      </div>
      <div className="pt-1 border-t border-app-border/60 flex items-center justify-between font-semibold text-app-text-primary">
        <span>Total:</span>
        <span className="font-mono">{total} commit</span>
      </div>
    </div>
  );
}
