'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { formatIdr } from '@/utils/format';

interface ChartDatum {
  label: string;
  revenue: number;
  rentals: number;
}

/**
 * Recharts bar visualization styled in Signal Amber and Charcoal for Admin reports.
 */
export function ReportChartCard({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: ChartDatum[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-stone-500">{subtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 12, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#57534E', fontSize: 11 }}
                axisLine={{ stroke: '#D6D3CD' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#57534E', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) =>
                  typeof val === 'number' ? `${Math.round(val / 1000)}k` : String(val)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E7E5E0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value, name) => {
                  const num = typeof value === 'number' ? value : Number(value ?? 0);
                  if (name === 'revenue') {
                    return [formatIdr(num), 'Revenue'];
                  }
                  return [num, 'Rentals'];
                }}
              />
              <Bar dataKey="revenue" fill="#D97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
