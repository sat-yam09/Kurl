import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Award, Zap, Trophy } from "lucide-react";

export default function Achievements() {
  const { user } = useAuth();

  const achievementsQuery = trpc.achievements.userAchievements.useQuery(undefined, { enabled: !!user });
  const streaksQuery = trpc.streaks.list.useQuery(undefined, { enabled: !!user });

  const userAchievements = achievementsQuery.data || [];
  const streaks = streaksQuery.data || [];

  const mockAchievements = [
    { id: 1, name: "First Workout", description: "Complete your first workout session", icon: "🎯", unlocked: true },
    { id: 2, name: "Week Warrior", description: "Complete 7 workouts in a week", icon: "⚡", unlocked: false },
    { id: 3, name: "Month Master", description: "Complete 30 workouts in a month", icon: "🏆", unlocked: false },
    { id: 4, name: "Strength Seeker", description: "Increase your max lift by 10%", icon: "💪", unlocked: true },
    { id: 5, name: "Consistency King", description: "Maintain a 30-day streak", icon: "👑", unlocked: false },
    { id: 6, name: "Volume Victor", description: "Reach 100,000 total volume", icon: "📈", unlocked: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Achievements & Badges</h1>
        <p className="text-muted-foreground mt-1">Unlock badges and celebrate your fitness milestones</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" />
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{userAchievements.length}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{streaks[0]?.currentCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">days</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{Math.round((userAchievements.length / mockAchievements.length) * 100)}%</div>
            <p className="text-xs text-muted-foreground mt-1">complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockAchievements.map((achievement) => (
            <Card key={achievement.id} className={`${achievement.unlocked ? "" : "opacity-50"}`}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-5xl mb-3">{achievement.icon}</div>
                  <h3 className="font-semibold">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="mt-4 inline-block px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-semibold">
                      Unlocked
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Streaks */}
      {streaks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Streaks</CardTitle>
            <CardDescription>Your consistency tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {streaks.map((streak) => (
              <div key={streak.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{streak.streakType}</p>
                  <p className="text-sm text-muted-foreground">Best: {streak.maxCount} days</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-accent">{streak.currentCount}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
