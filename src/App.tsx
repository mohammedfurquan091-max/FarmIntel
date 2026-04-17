import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./i18n";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Advisor from "./pages/Advisor";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Weather from "./pages/Weather";
import Schemes from "./pages/Schemes";
import MarketMap from "./pages/MarketMap";
import CropDoctor from "./pages/CropDoctor";
import ProfitCalc from "./pages/ProfitCalc";
import SoilLab from "./pages/SoilLab";
import CropCalendar from "./pages/CropCalendar";
import AgriNews from "./pages/AgriNews";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard"   element={<Dashboard />} />
              <Route path="/advisor"     element={<Advisor />} />
              <Route path="/market-map"  element={<MarketMap />} />
              <Route path="/crop-doctor" element={<CropDoctor />} />
              <Route path="/profit-calc" element={<ProfitCalc />} />
              <Route path="/soil-lab"    element={<SoilLab />} />
              <Route path="/calendar"    element={<CropCalendar />} />
              <Route path="/news"        element={<AgriNews />} />
              <Route path="/weather"     element={<Weather />} />
              <Route path="/schemes"     element={<Schemes />} />
              <Route path="/alerts"      element={<Alerts />} />
              <Route path="/profile"     element={<Profile />} />
              <Route path="/admin"       element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
