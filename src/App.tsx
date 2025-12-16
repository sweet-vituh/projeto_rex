import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import NewRequisition from "./pages/NewRequisition";
import EditRequisition from "./pages/EditRequisition";
import Inbox from "./pages/Inbox";
import MyRequisitions from "./pages/MyRequisitions";
import RequisitionDetail from "./pages/RequisitionDetail";
import History from "./pages/History";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// EPI Module
import EpiHome from "./pages/epi/EpiHome";
import NewEpiRequisition from "./pages/epi/NewEpiRequisition";
import EpiInbox from "./pages/epi/EpiInbox";
import EpiRequisitionDetail from "./pages/epi/EpiRequisitionDetail";
import SafetyDashboard from "./pages/epi/SafetyDashboard";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              
              {/* Módulo de Materiais (Padrão) */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute allowedRoles={["mechanic"]}>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nova-requisicao"
                element={
                  <ProtectedRoute allowedRoles={["mechanic"]}>
                    <NewRequisition />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editar-requisicao/:id"
                element={
                  <ProtectedRoute allowedRoles={["mechanic"]}>
                    <EditRequisition />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inbox"
                element={
                  <ProtectedRoute allowedRoles={["pcm"]}>
                    <Inbox />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/minhas-requisicoes"
                element={
                  <ProtectedRoute allowedRoles={["pcm"]}>
                    <MyRequisitions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requisicao/:id"
                element={
                  <ProtectedRoute allowedRoles={["mechanic", "pcm"]}>
                    <RequisitionDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historico"
                element={
                  <ProtectedRoute allowedRoles={["mechanic"]}>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* Módulo de EPI (Novo) */}
              <Route
                path="/epi/home"
                element={
                  <ProtectedRoute allowedRoles={["mechanic"]}>
                    <EpiHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/epi/new"
                element={
                  <ProtectedRoute allowedRoles={["mechanic"]}>
                    <NewEpiRequisition />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/epi/inbox"
                element={
                  <ProtectedRoute allowedRoles={["pcm"]}>
                    <EpiInbox />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/epi/request/:id"
                element={
                  <ProtectedRoute allowedRoles={["mechanic", "pcm"]}>
                    <EpiRequisitionDetail />
                  </ProtectedRoute>
                }
              />
              
              {/* Painel do Técnico de Segurança */}
              <Route
                path="/epi/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["safety_tech"]}>
                    <SafetyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;