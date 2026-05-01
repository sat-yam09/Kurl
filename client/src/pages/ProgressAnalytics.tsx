import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function ProgressAnalytics() {
  const { user } = useAuth();

  const bodyMetricsQuery = trpc.bodyMetrics.list.useQuery({ limit: 30 }, { enabled: !!user });
  const sessionsQuery = trpc.sessions.list.useQuery({ limit: 100 }, { enabled: !!user });

  const bodyMetrics = bodyMetricsQuery.data || [];
  const sessions = sessionsQuery.data || [];

  const totalWorkouts = sessions.length;
  const totalVolume = sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
  const avgDuration = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / sessions.length) : 0;

  const weightData = [
    { week: "Week 1", weight: 185 },
    { week: "Week 2", weight: 184 },
    { week: "Week 3", weight: 183 },
    { week: "Week 4", weight: 182 },
    { week: "Week 5", weight: 181 },
  ];

  const volumeData = [
    { week: "Week 1", volume: 8500 },
    { week: "Week 2", volume: 9200 },
    { week: "Week 3", volume: 9800 },
    { week: "Week 4", volume: 10500 },
    { week: "Week 5", volume: 11200 },
  ];

  const exerciseDistribution = [
    { name: "Chest", value: 25 },
    { name: "Back", value: 20 },
    { name: "Legs", value: 30 },
    { name: "Arms", value: 15 },
    { name: "Shoulders", value: 10 },
  ];

  const COLORS = ["var(--accent)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Progress Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your fitness journey with detailed insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{totalWorkouts}</div>
            <p className="text-xs text-muted-foreground mt-1">Training sessions completed</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Reps × weight (lbs)</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{avgDuration}</div>
            <p className="text-xs text-muted-foreground mt-1">Minutes per session</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
            <CardDescription>Body weight over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Area type="monotone" dataKey="weight" stroke="var(--accent)" fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume Progression</CardTitle>
            <CardDescription>Total training volume per week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="volume" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exercise Distribution</CardTitle>
            <CardDescription>Muscle group focus breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={exerciseDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="var(--accent)" dataKey="value">
                  {exerciseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Records</CardTitle>
            <CardDescription>Your best lifts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Bench Press</p>
                <p className="text-sm text-muted-foreground">Chest</p>
              </div>
              <p className="text-2xl font-bold text-accent">185 lbs</p>
            </div>
            <div className="flex justify-between items-center p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Squat</p>
                <p className="text-sm text-muted-foreground">Legs</p>
              </div>
              <p className="text-2xl font-bold text-accent">315 lbs</p>
            </div>
            <div className="flex justify-between items-center p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Deadlift</p>
                <p className="text-sm text-muted-foreground">Full Body</p>
              </div>
              <p className="text-2xl font-bold text-accent">405 lbs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparison Period</CardTitle>
          <CardDescription>View progress over different time ranges</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button variant="outline">This Week</Button>
          <Button variant="outline">This Month</Button>
          <Button variant="outline">Last 3 Months</Button>
          <Button variant="outline">This Year</Button>
          <Button variant="outline">All Time</Button>
        </CardContent>
      </Card>
    </div>
  );
}
