import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Activity, Target, TrendingUp, Zap, Calendar, Award } from "lucide-react";
import { useLocation } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const sessionsQuery = trpc.sessions.list.useQuery({ limit: 10 }, { enabled: !!user });
  const goalsQuery = trpc.goals.list.useQuery({ status: "active" }, { enabled: !!user });
  const wellnessQuery = trpc.wellness.list.useQuery({ limit: 7 }, { enabled: !!user });
  const streaksQuery = trpc.streaks.list.useQuery(undefined, { enabled: !!user });
  const achievementsQuery = trpc.achievements.userAchievements.useQuery(undefined, { enabled: !!user });

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-accent animate-pulse" />
          <p className="text-muted-foreground">Loading your fitness dashboard...</p>
        </div>
      </div>
    );
  }

  const recentSessions = sessionsQuery.data || [];
  const activeGoals = goalsQuery.data || [];
  const userStreaks = streaksQuery.data || [];
  const userAchievements = achievementsQuery.data || [];

  const volumeData = [
    { week: "Week 1", volume: 2400 },
    { week: "Week 2", volume: 2210 },
    { week: "Week 3", volume: 2290 },
    { week: "Week 4", volume: 2000 },
    { week: "Week 5", volume: 2181 },
  ];

  const strengthData = [
    { exercise: "Bench", current: 185, previous: 175 },
    { exercise: "Squat", current: 315, previous: 305 },
    { exercise: "Deadlift", current: 405, previous: 395 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || "Athlete"}!</h1>
          <p className="text-muted-foreground mt-1">Track your progress and achieve your fitness goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              Workouts This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{recentSessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Keep the momentum going</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Goals in progress</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{userStreaks[0]?.currentCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Days of consistency</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{userAchievements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Badges earned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Volume Trend</CardTitle>
            <CardDescription>Total reps × weight over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Line type="monotone" dataKey="volume" stroke="var(--accent)" strokeWidth={2} dot={{ fill: "var(--accent)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strength Progress</CardTitle>
            <CardDescription>Current vs previous maxes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strengthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="exercise" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Bar dataKey="previous" fill="var(--muted)" />
                <Bar dataKey="current" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={() => navigate("/logger")} className="h-24 text-lg font-semibold bg-accent hover:bg-accent/90">
          <Activity className="mr-2 w-6 h-6" />
          Log Workout
        </Button>
        <Button onClick={() => navigate("/planner")} variant="outline" className="h-24 text-lg font-semibold">
          <Calendar className="mr-2 w-6 h-6" />
          Plan Routine
        </Button>
        <Button onClick={() => navigate("/goals")} variant="outline" className="h-24 text-lg font-semibold">
          <Target className="mr-2 w-6 h-6" />
          Set Goals
        </Button>
      </div>

      {recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <CardDescription>Your latest training sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{session.name}</p>
                    <p className="text-sm text-muted-foreground">{session.focusArea}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-accent">{session.durationMinutes || 0} min</p>
                    <p className="text-xs text-muted-foreground">{session.totalSets || 0} sets</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
