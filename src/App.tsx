import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import HostDashboard from "./pages/HostDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
import GameManage from "./pages/GameManage";
import PlayGame from "./pages/PlayGame";
import GameGallery from "./pages/GameGallery";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/player" element={<PlayerDashboard />} />
            <Route path="/create-game" element={<CreateGame />} />
            <Route path="/join/:inviteCode" element={<JoinGame />} />
            <Route path="/game/:gameId/manage" element={<GameManage />} />
            <Route path="/game/:gameId/gallery" element={<GameGallery />} />
            <Route path="/play/:playerId" element={<PlayGame />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
