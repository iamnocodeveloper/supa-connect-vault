import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Database, Users, Activity, HardDrive, Wifi } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { supabaseClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';

// Mock data for charts
const chartData = [
  { name: 'Mon', requests: 400, users: 240 },
  { name: 'Tue', requests: 300, users: 139 },
  { name: 'Wed', requests: 500, users: 280 },
  { name: 'Thu', requests: 278, users: 390 },
  { name: 'Fri', requests: 189, users: 480 },
  { name: 'Sat', requests: 239, users: 380 },
  { name: 'Sun', requests: 349, users: 430 },
];

const userGrowthData = [
  { month: 'Jan', users: 400 },
  { month: 'Feb', users: 600 },
  { month: 'Mar', users: 800 },
  { month: 'Apr', users: 1200 },
  { month: 'May', users: 1600 },
  { month: 'Jun', users: 1752 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await supabaseClient.initialize();
      if (!connected) {
        navigate('/');
        return;
      }

      try {
        const projectStats = await supabaseClient.getProjectStats();
        setStats(projectStats);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [navigate]);

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm">Monitor your project's key metrics</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/settings')}
            >
              Settings
            </Button>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="px-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="REST Requests"
              value={stats?.restRequests || '1,539'}
              subtitle="Past 7 days"
              icon={<Database className="w-5 h-5" />}
            >
              <div className="h-16 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-4)}>
                    <Bar dataKey="requests" fill="hsl(var(--primary))" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </MetricCard>

            <MetricCard
              title="Auth Requests"
              value={stats?.authRequests || '44'}
              subtitle="Past 7 days"
              icon={<Users className="w-5 h-5" />}
            >
              <div className="h-16 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-4)}>
                    <Bar dataKey="users" fill="hsl(var(--primary-glow))" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </MetricCard>

            <MetricCard
              title="Storage Requests"
              value={stats?.storageRequests || '647'}
              subtitle="Past 7 days"
              icon={<HardDrive className="w-5 h-5" />}
            >
              <div className="h-16 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-4)}>
                    <Bar dataKey="requests" fill="hsl(var(--primary-muted))" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </MetricCard>

            <MetricCard
              title="Realtime"
              value={stats?.realtimeRequests || '0'}
              subtitle="Connections"
              icon={<Wifi className="w-5 h-5" />}
            />
          </div>

          {/* User Growth Chart */}
          <MetricCard
            title="Users Over Time"
            value={stats?.totalUsers || '1,752'}
            subtitle="Total registered users"
            className="col-span-full"
          >
            <div className="h-32 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#userGradient)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </MetricCard>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/browser')}
              className="h-12 flex flex-col items-center justify-center space-y-1"
            >
              <Database className="w-4 h-4" />
              <span className="text-xs">Browse Data</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/console')}
              className="h-12 flex flex-col items-center justify-center space-y-1"
            >
              <Activity className="w-4 h-4" />
              <span className="text-xs">SQL Console</span>
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}