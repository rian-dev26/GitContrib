import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Cpu } from 'lucide-react';
import { ClassificationSummary } from '../../../types/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

interface ClassificationChartProps {
  classification: ClassificationSummary;
}

export function ClassificationChart({ classification }: ClassificationChartProps) {
  const chartData = [
    {
      name: 'Commit YES',
      value: classification.yesCount,
      percentage: classification.yesPercentage,
      color: '#89E19C', // Aksen positif
    },
    {
      name: 'Commit NO',
      value: classification.noCount,
      percentage: classification.noPercentage,
      color: '#E06C75', // Aksen negatif lembut
    },
  ];

  const total = classification.totalAnalyzed;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-app-accent-primary" />
          <CardTitle className="text-sm">Distribusi Prediksi YES / NO</CardTitle>
        </div>
        <span className="text-xs text-app-text-secondary font-mono">
          {total} dievaluasi
        </span>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Recharts Donut Chart Container */}
        <div className="relative h-44 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-app-card border border-app-border rounded-md px-3 py-2 text-xs shadow-xl">
                        <div className="font-semibold text-app-text-primary flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                          {data.name}
                        </div>
                        <div className="text-app-text-secondary mt-1">
                          {data.value} commit ({data.percentage}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Statistic Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-lg font-bold text-app-text-primary tracking-tight font-sans">
              {classification.yesPercentage}%
            </span>
            <span className="text-[10px] text-app-text-secondary uppercase tracking-wider">
              Rasio YES
            </span>
          </div>
        </div>

        {/* Legend & Breakdown */}
        <div className="space-y-2 pt-1 border-t border-app-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-app-accent-positive shrink-0" />
              <span className="text-app-text-primary font-medium">Prediksi YES</span>
            </div>
            <span className="font-mono text-app-text-primary">
              {classification.yesCount} ({classification.yesPercentage}%)
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-app-accent-negative shrink-0" />
              <span className="text-app-text-primary font-medium">Prediksi NO</span>
            </div>
            <span className="font-mono text-app-text-primary">
              {classification.noCount} ({classification.noPercentage}%)
            </span>
          </div>
        </div>

        {/* Notice text */}
        <p className="text-[11px] text-app-text-secondary/80 leading-relaxed text-center">
          {classification.notice}
        </p>
      </CardContent>
    </Card>
  );
}
