import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
const Index = lazy(() => import("./pages/Index"));
const EditTicket = lazy(() => import("./pages/EditTicket"));
const TicketDetails = lazy(() => import("./pages/TicketDetails"));
const PrintTicketPage = lazy(() => import("./pages/PrintTicketPage"));
const Settings = lazy(() => import("./pages/Settings"));

const SeatBookings = lazy(() => import("./pages/SeatBookings"));
const Profit = lazy(() => import("./pages/Profit"));
const AgentCollections = lazy(() => import("./pages/AgentCollections"));
const PayCollection = lazy(() => import("./pages/PayCollection"));
const Tickets = lazy(() => import("./pages/Tickets"));
const Hisab = lazy(() => import("./pages/Hisab"));
const TicketEntry = lazy(() => import("./pages/TicketEntry"));
const Memo = lazy(() => import("./pages/Memo"));
const Auth = lazy(() => import("./pages/Auth"));
const OwnerCompanies = lazy(() => import("./pages/owner/OwnerCompanies"));
const OwnerLayouts = lazy(() => import("./pages/owner/OwnerLayouts"));
const OwnerCommissions = lazy(() => import("./pages/owner/OwnerCommissions"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } });

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute adminOnly><Tickets /></ProtectedRoute>} />
            <Route path="/edit-ticket/:id" element={<ProtectedRoute adminOnly><EditTicket /></ProtectedRoute>} />
            <Route path="/ticket/:id" element={<ProtectedRoute adminOnly><TicketDetails /></ProtectedRoute>} />
            <Route path="/ticket/:id/print" element={<ProtectedRoute adminOnly><PrintTicketPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
            <Route path="/seat-bookings" element={<ProtectedRoute adminOnly><SeatBookings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Profit /></ProtectedRoute>} />
            <Route path="/memo" element={<ProtectedRoute adminOnly><Memo /></ProtectedRoute>} />
            <Route path="/agent-collections" element={<ProtectedRoute adminOnly><AgentCollections /></ProtectedRoute>} />
            <Route path="/pay-collection" element={<ProtectedRoute><PayCollection /></ProtectedRoute>} />
            <Route path="/ticket-entry" element={<ProtectedRoute><TicketEntry /></ProtectedRoute>} />
            <Route path="/hisab" element={<ProtectedRoute><Hisab /></ProtectedRoute>} />
            <Route path="/owner" element={<Navigate to="/admin" replace />} />
            <Route path="/owner/companies" element={<ProtectedRoute adminOnly><OwnerCompanies /></ProtectedRoute>} />
            <Route path="/owner/layouts" element={<ProtectedRoute adminOnly><OwnerLayouts /></ProtectedRoute>} />
            <Route path="/owner/commissions" element={<ProtectedRoute adminOnly><OwnerCommissions /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
