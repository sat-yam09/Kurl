import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function WorkoutPlanner() {
  const { user } = useAuth();
  const [routineName, setRoutineName] = useState("");
  const [focusArea, setFocusArea] = useState("full_body");

  const routinesQuery = trpc.routines.list.useQuery(undefined, { enabled: !!user });
  const createRoutineMutation = trpc.routines.create.useMutation();
  const scheduledQuery = trpc.scheduled.upcoming.useQuery({ days: 7 }, { enabled: !!user });

  const routines = routinesQuery.data || [];
  const scheduled = scheduledQuery.data || [];

  const handleCreateRoutine = async () => {
    if (!routineName.trim()) {
      toast.error("Please enter a routine name");
      return;
    }

    try {
      await createRoutineMutation.mutateAsync({
        name: routineName,
        focusArea: focusArea as any,
      });
      toast.success("Workout routine created!");
      setRoutineName("");
      routinesQuery.refetch();
    } catch (error) {
      toast.error("Failed to create routine");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Workout Planner</h1>
        <p className="text-muted-foreground mt-1">Create and schedule your training routines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Routine</CardTitle>
              <CardDescription>Design a custom workout routine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="routine-name">Routine Name</Label>
                <Input
                  id="routine-name"
                  placeholder="e.g., Push Day"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  className="input-focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus-area">Focus Area</Label>
                <Select value={focusArea} onValueChange={setFocusArea}>
                  <SelectTrigger id="focus-area" className="input-focus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_body">Full Body</SelectItem>
                    <SelectItem value="upper_body">Upper Body</SelectItem>
                    <SelectItem value="lower_body">Lower Body</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="pull">Pull</SelectItem>
                    <SelectItem value="legs">Legs</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateRoutine}
                disabled={createRoutineMutation.isPending}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <Plus className="mr-2 w-4 h-4" />
                Create Routine
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="stat-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Routines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{routines.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Custom routines created</p>
          </CardContent>
        </Card>
      </div>

      {/* Saved Routines */}
      {routines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Routines</CardTitle>
            <CardDescription>Saved workout routines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {routines.map((routine) => (
              <div key={routine.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{routine.name}</p>
                  <p className="text-sm text-muted-foreground">{routine.focusArea}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 w-4 h-4" />
                  Schedule
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Workouts */}
      {scheduled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Workouts</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduled.map((workout) => (
              <div key={workout.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{workout.name}</p>
                  <p className="text-sm text-muted-foreground">{new Date(workout.scheduledDate).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm">Start</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
