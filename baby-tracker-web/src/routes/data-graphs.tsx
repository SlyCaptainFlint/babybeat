
import { useLoaderData, Await } from 'react-router-dom';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { AggregationData } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
} from 'recharts';

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    payload: any;
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="subtitle2">
        {format(parseISO(label || ''), 'MMM d, yyyy')}
      </Typography>
      {payload.map((entry, index) => (
        <Typography key={index} variant="body2" sx={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1)}
        </Typography>
      ))}
    </Paper>
  );
};

const LoadingChart = () => (
  <Box sx={{ width: '100%', height: '100%' }}>
    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height="calc(100% - 40px)" />
  </Box>
);

const ChartCard = ({ title, children, isLoading }: { 
  title: string, 
  children: React.ReactNode,
  isLoading?: boolean 
}) => (
  <Paper 
    elevation={2} 
    sx={{ 
      p: 3, 
      mb: 3,
      height: 400,
      overflow: 'hidden',
    }}
  >
    {isLoading ? (
      <LoadingChart />
    ) : (
      <>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {children}
      </>
    )}
  </Paper>
);

export function Component() {
  const {aggregationsPromise} = useLoaderData() as {aggregationsPromise: Promise<AggregationData>};
  const formatXAxis = (value: string) => format(parseISO(value), 'MMM d');
  const mapSleepData = (aggregations: AggregationData) => { 
    return aggregations.weeklyStats.map(week => ({
      weekStart: week.weekStart,
      dailyAverages: {
        sleep: {
          ...week.dailyAverages.sleep,
          duration: week.dailyAverages.sleep.duration / 60,
          count: week.dailyAverages.sleep.count
        }
      }
    }));
  }

  return (
    <Await resolve={aggregationsPromise}>
      {(aggregations) => (
        <Box>
          {!aggregations.weeklyStats || aggregations.weeklyStats.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" >
                No data available.
              </Typography>
            </Box>
          ) : (
            <>
              <ChartCard title="Average Daily Sleep Duration by Week">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={mapSleepData(aggregations)}
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="weekStart"
                      tickFormatter={formatXAxis}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      yAxisId="left"
                      domain={[0, 'auto']}
                      label={{
                        value: 'Average Hours per Day',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 'auto']}
                      label={{
                        value: 'Number of Sleeps',
                        angle: 90,
                        position: 'insideRight',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="dailyAverages.sleep.duration"
                      name="Total Sleep"
                      fill="#8884d8"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="dailyAverages.sleep.count"
                      name="Number of Sleeps"
                      stroke="#82ca9d"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Average Daily Diapers by Week">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={aggregations.weeklyStats}
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="weekStart"
                      tickFormatter={formatXAxis}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      domain={[0, 'auto']}
                      label={{
                        value: 'Average Diapers per Day',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="dailyAverages.diaper.count"
                      name="Total Diapers"
                      fill="#82ca9d"
                      stackId="a"
                    />
                    <Bar
                      dataKey="dailyAverages.diaper.byType.dirty"
                      name="Dirty Diapers"
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Average Daily Feeds by Week">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={aggregations.weeklyStats}
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="weekStart"
                      tickFormatter={formatXAxis}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      yAxisId="left"
                      domain={[0, 'auto']}
                      label={{
                        value: 'Number of Feeds',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 'auto']}
                      label={{
                        value: 'Volume (ml)',
                        angle: 90,
                        position: 'insideRight',
                        style: { textAnchor: 'middle' }
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="dailyAverages.feed.count"
                      name="Number of Feeds"
                      fill="#8884d8"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="dailyAverages.feed.volume"
                      name="Volume"
                      stroke="#82ca9d"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}
        </Box>
      )}
    </Await>
  );
} 