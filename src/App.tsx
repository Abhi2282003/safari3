import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import NewTicket from "./pages/NewTicket";
import EditTicket from "./pages/EditTicket";
import TicketDetails from "./pages/TicketDetails";
import PrintTicketPage from "./pages/PrintTicketPage";
import Settings from "./pages/Settings";

import SeatBookings from "./pages/SeatBookings";
import Profit from "./pages/Profit";
import AgentCollections from "./pages/AgentCollections";
import PayCollection from "./pages/PayCollection";
import Tickets from "./pages/Tickets";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/new-ticket" element={<ProtectedRoute><NewTicket /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
            <Route path="/edit-ticket/:id" element={<ProtectedRoute><EditTicket /></ProtectedRoute>} />
            <Route path="/ticket/:id" element={<ProtectedRoute><TicketDetails /></ProtectedRoute>} />
            <Route path="/ticket/:id/print" element={<ProtectedRoute><PrintTicketPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/seat-bookings" element={<ProtectedRoute><SeatBookings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Profit /></ProtectedRoute>} />
            <Route path="/agent-collections" element={<ProtectedRoute><AgentCollections /></ProtectedRoute>} />
            <Route path="/pay-collection" element={<ProtectedRoute><PayCollection /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
