import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import WorkoutPlanner from "./pages/WorkoutPlanner";
import WorkoutLogger from "./pages/WorkoutLogger";
import ProgressAnalytics from "./pages/ProgressAnalytics";
import GoalsManagement from "./pages/GoalsManagement";
import WellnessTracking from "./pages/WellnessTracking";
import Achievements from "./pages/Achievements";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/planner"} component={WorkoutPlanner} />
      <Route path={"/logger"} component={WorkoutLogger} />
      <Route path={"/progress"} component={ProgressAnalytics} />
      <Route path={"/goals"} component={GoalsManagement} />
      <Route path={"/wellness"} component={WellnessTracking} />
      <Route path={"/achievements"} component={Achievements} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
