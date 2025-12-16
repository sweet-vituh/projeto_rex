import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, HardHat, LogOut, Package } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { RexLogo } from "@/components/RexLogo";

const ModuleSelection = () => {
  const navigate = useNavigate();
  const { user, username, role, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <RexLogo />
            <p className="text-sm text-muted-foreground">Olá, {username}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">O que você precisa hoje?</h1>
          <p className="text-muted-foreground">Selecione o tipo de requisição que deseja fazer.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Módulo de Materiais */}
          <Card 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50"
            onClick={() => navigate("/home")}
          >
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Wrench className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Peças e Materiais</h2>
                <p className="text-muted-foreground">
                  Solicitar peças para manutenção de máquinas e equipamentos.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Módulo de EPI */}
          <Card 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-orange-500/50"
            onClick={() => navigate("/epi/home")}
          >
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <HardHat className="w-12 h-12 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">EPIs e Segurança</h2>
                <p className="text-muted-foreground">
                  Solicitar Equipamentos de Proteção Individual e fardamento.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões de acesso rápido para funções específicas */}
        <div className="flex gap-4 mt-8">
           {role === 'pcm' && (
             <Button variant="outline" onClick={() => navigate("/inbox")}>
               Voltar para Gestão PCM
             </Button>
           )}
           {role === 'safety_tech' && (
             <Button variant="outline" onClick={() => navigate("/epi/dashboard")}>
               Voltar para Dashboard Segurança
             </Button>
           )}
           {role === 'almoxarifado' && (
             <Button variant="outline" onClick={() => navigate("/stock/dashboard")}>
               Voltar para Controle de Estoque
             </Button>
           )}
        </div>
      </main>
    </div>
  );
};

export default ModuleSelection;