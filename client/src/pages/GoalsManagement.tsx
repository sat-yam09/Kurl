import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Target, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function GoalsManagement() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState("muscle_gain");

  const goalsQuery = trpc.goals.list.useQuery(undefined, { enabled: !!user });
  const createGoalMutation = trpc.goals.create.useMutation();

  const goals = goalsQuery.data || [];
  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  const handleCreateGoal = async () => {
    if (!title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    try {
      await createGoalMutation.mutateAsync({
        title,
        goalType: goalType as any,
        startDate: new Date(),
      });
      toast.success("Goal created successfully!");
      setTitle("");
      goalsQuery.refetch();
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Fitness Goals</h1>
        <p className="text-muted-foreground mt-1">Set and track your fitness objectives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
              <CardDescription>Set a new fitness objective</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-title">Goal Title</Label>
                <Input
                  id="goal-title"
                  placeholder="e.g., Lose 10 pounds"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-type">Goal Type</Label>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger id="goal-type" className="input-focus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="consistency">Consistency</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateGoal}
                disabled={createGoalMutation.isPending}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <Plus className="mr-2 w-4 h-4" />
                Create Goal
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">{activeGoals.length}</div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">{completedGoals.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
            <CardDescription>Your current fitness objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{goal.title}</p>
                  <p className="text-sm text-muted-foreground">{goal.goalType}</p>
                </div>
                <div className="text-right">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${goal.progress || 0}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{goal.progress || 0}% complete</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Goals</CardTitle>
            <CardDescription>Your achieved objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-sm text-muted-foreground">{goal.goalType}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-green-600">Completed</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
