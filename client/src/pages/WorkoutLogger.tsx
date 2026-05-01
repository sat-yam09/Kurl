import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Clock, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function WorkoutLogger() {
  const { user } = useAuth();
  const [sessionName, setSessionName] = useState("");
  const [focusArea, setFocusArea] = useState("full_body");
  const [mood, setMood] = useState("good");
  const [energy, setEnergy] = useState(5);
  const [notes, setNotes] = useState("");
  const [startTime] = useState(new Date());
  const [isLogging, setIsLogging] = useState(false);

  const createSessionMutation = trpc.sessions.create.useMutation();
  const completeSessionMutation = trpc.sessions.complete.useMutation();

  const handleStartSession = async () => {
    if (!sessionName.trim()) {
      toast.error("Please enter a workout name");
      return;
    }

    setIsLogging(true);
    try {
      const result = await createSessionMutation.mutateAsync({
        name: sessionName,
        focusArea: focusArea as any,
        startTime,
        mood: mood as any,
        energy: parseInt(energy.toString()),
        notes,
      });

      toast.success("Workout session started!");
      setSessionName("");
      setNotes("");
    } catch (error) {
      toast.error("Failed to start workout session");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Workout Logger</h1>
        <p className="text-muted-foreground mt-1">Track your workout in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Start New Workout</CardTitle>
              <CardDescription>Log your training session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="session-name">Workout Name</Label>
                <Input
                  id="session-name"
                  placeholder="e.g., Chest & Triceps"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mood">Mood</Label>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger id="mood" className="input-focus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="terrible">Terrible</SelectItem>
                      <SelectItem value="bad">Bad</SelectItem>
                      <SelectItem value="okay">Okay</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="great">Great</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="energy">Energy Level ({energy}/10)</Label>
                  <Input
                    id="energy"
                    type="range"
                    min="1"
                    max="10"
                    value={energy}
                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                    className="input-focus"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about your workout..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-focus min-h-24"
                />
              </div>

              <Button
                onClick={handleStartSession}
                disabled={isLogging}
                className="w-full bg-accent hover:bg-accent/90 h-12 text-base font-semibold"
              >
                <Clock className="mr-2 w-5 h-5" />
                {isLogging ? "Starting..." : "Start Workout"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Session Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">
                {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">0 min</p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">0</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exercise Logging */}
      <Card>
        <CardHeader>
          <CardTitle>Add Exercises</CardTitle>
          <CardDescription>Log sets, reps, and weight for each exercise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
            <div className="text-center">
              <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Start a workout to add exercises</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
