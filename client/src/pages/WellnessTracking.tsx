import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Droplet, Moon, Smile } from "lucide-react";
import { toast } from "sonner";

export default function WellnessTracking() {
  const { user } = useAuth();
  const [sleepHours, setSleepHours] = useState(7);
  const [waterIntake, setWaterIntake] = useState(8);
  const [mood, setMood] = useState("good");
  const [energy, setEnergy] = useState(5);

  const wellnessQuery = trpc.wellness.list.useQuery({ limit: 30 }, { enabled: !!user });
  const createWellnessMutation = trpc.wellness.create.useMutation();

  const wellnessLogs = wellnessQuery.data || [];
  const todayLog = wellnessLogs.find(log => new Date(log.logDate).toDateString() === new Date().toDateString());

  const handleLogWellness = async () => {
    try {
      await createWellnessMutation.mutateAsync({
        logDate: new Date(),
        sleepHours: parseFloat(sleepHours.toString()),
        waterIntakeLiters: parseFloat(waterIntake.toString()),
        mood: mood as any,
        energyLevel: parseInt(energy.toString()),
      });
      toast.success("Wellness logged successfully!");
      wellnessQuery.refetch();
    } catch (error) {
      toast.error("Failed to log wellness");
    }
  };

  const avgSleep = wellnessLogs.length > 0 ? (wellnessLogs.reduce((sum, log) => sum + (parseFloat(log.sleepHours as any) || 0), 0) / wellnessLogs.length).toFixed(1) : 0;
  const avgWater = wellnessLogs.length > 0 ? (wellnessLogs.reduce((sum, log) => sum + (parseFloat(log.waterIntakeLiters as any) || 0), 0) / wellnessLogs.length).toFixed(1) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Wellness Tracking</h1>
        <p className="text-muted-foreground mt-1">Monitor your sleep, hydration, and overall wellbeing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Log Today's Wellness</CardTitle>
              <CardDescription>Track your daily health metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sleep">Sleep Hours ({sleepHours}h)</Label>
                  <Input
                    id="sleep"
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="input-focus"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="water">Water Intake ({waterIntake}L)</Label>
                  <Input
                    id="water"
                    type="range"
                    min="0"
                    max="16"
                    step="0.5"
                    value={waterIntake}
                    onChange={(e) => setWaterIntake(parseFloat(e.target.value))}
                    className="input-focus"
                  />
                </div>
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
                  <Label htmlFor="energy">Energy ({energy}/10)</Label>
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

              <Button
                onClick={handleLogWellness}
                disabled={createWellnessMutation.isPending}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <Plus className="mr-2 w-4 h-4" />
                Log Wellness
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Avg Sleep
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">{avgSleep}h</div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplet className="w-4 h-4" />
                Avg Water
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">{avgWater}L</div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smile className="w-4 h-4" />
                Logged Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stat-value">{wellnessLogs.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Logs */}
      {wellnessLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Wellness Logs</CardTitle>
            <CardDescription>Your wellness history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wellnessLogs.slice(0, 7).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{new Date(log.logDate).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">{log.mood} • Energy {log.energyLevel}/10</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{log.sleepHours}h sleep</p>
                    <p className="text-muted-foreground">{log.waterIntakeLiters}L water</p>
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
