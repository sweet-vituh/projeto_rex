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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
