import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Movies } from "./pages/Movies";
import { Shows } from "./pages/Shows";
import { Calendar } from "./pages/Calendar";
import { Queue } from "./pages/Queue";
import { Settings } from "./pages/Settings";
import { Apps } from "./pages/Apps";
import { Onboarding } from "./pages/Onboarding";
import { getSettings } from "./api";

const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5000, retry: 1 },
  },
});

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  if (isLoading) return null;

  const isComplete = settings?.onboarding_complete === "true";
  const isOnboarding = location.pathname === "/onboarding";

  if (!isComplete && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  if (isComplete && isOnboarding) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <OnboardingGuard>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/shows" element={<Shows />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/queue" element={<Queue />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </OnboardingGuard>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0d0025",
            color: "#d4c8f0",
            border: "1px solid rgba(255,0,110,0.3)",
            boxShadow: "0 0 20px rgba(255,0,110,0.15), 0 8px 32px rgba(0,0,0,0.5)",
            fontFamily: '"Exo 2", sans-serif',
            fontSize: 13,
          },
          success: { iconTheme: { primary: "#00ff88", secondary: "#0d0025" } },
          error:   { iconTheme: { primary: "#ff006e", secondary: "#0d0025" } },
        }}
      />
    </QueryClientProvider>
  );
}
