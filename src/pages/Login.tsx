import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loginSchema } from "@/lib/validations";
import logo from "@/assets/logo.png";
import { HardHat, Wrench, ArrowLeft } from "lucide-react";

type ModuleType = "materials" | "epi" | null;

const Login = () => {
  const [selectedModule, setSelectedModule] = useState<ModuleType>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ username?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already logged in - Only redirects if a module is selected
  useEffect(() => {
    if (!selectedModule) return;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        handleRedirect(roleData?.role);
      }
    };
    checkSession();
  }, [navigate, selectedModule]);

  const handleRedirect = (role?: string) => {
    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "safety_tech") {
      navigate("/epi/dashboard", { replace: true });
    } else if (role === "pcm") {
      if (selectedModule === "epi") {
        navigate("/epi/inbox", { replace: true });
      } else {
        navigate("/inbox", { replace: true });
      }
    } else if (role === "mechanic") {
      if (selectedModule === "epi") {
        navigate("/epi/home", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }
  };

  const validateForm = (): boolean => {
    const result = loginSchema.safeParse({ username, password });
    
    if (!result.success) {
      const errors: { username?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "username") {
          errors.username = err.message;
        } else if (err.path[0] === "password") {
          errors.password = err.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }
    
    setValidationErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const email = `${username.toLowerCase().trim()}@rexapp.com`;

      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {}
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            throw new Error("Este usuário já está cadastrado");
          }
          throw signUpError;
        }

        if (authData.user) {
          const { error: roleError } = await supabase.rpc('create_user_role', {
            _user_id: authData.user.id,
            _username: username.trim()
          });

          if (roleError) {
            await supabase.auth.signOut();
            throw new Error("Erro ao criar perfil de usuário");
          }
        }

        toast({
          title: "Cadastro realizado!",
          description: "Você já pode fazer login.",
        });
        setIsSignUp(false);
        setPassword("");
      } else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Usuário ou senha incorretos");
          }
          throw signInError;
        }

        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role, username")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (roleError) throw roleError;

        if (!roleData) {
          await supabase.auth.signOut();
          throw new Error("Usuário não autorizado");
        }

        toast({
          title: "Login realizado!",
          description: `Bem-vindo ao Rex ${selectedModule === 'epi' ? 'EPI' : ''}!`,
        });

        handleRedirect(roleData.role);
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Erro ao cadastrar" : "Erro ao fazer login",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render Module Selection
  if (!selectedModule) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4 animate-fade-in relative gap-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="text-center space-y-4 mb-4">
          <div className="flex justify-center">
            <img src={logo} alt="Rex Logo" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-primary">Rex</h1>
          <p className="text-muted-foreground text-lg">Selecione o módulo para acessar</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
          <Card 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50"
            onClick={() => setSelectedModule("materials")}
          >
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Wrench className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Requisições de Materiais</h2>
                <p className="text-muted-foreground">
                  Solicitação de peças e materiais para manutenção geral.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-orange-500/50"
            onClick={() => setSelectedModule("epi")}
          >
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <HardHat className="w-10 h-10 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Requisições de EPI</h2>
                <p className="text-muted-foreground">
                  Solicitação de Equipamentos de Proteção Individual.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Desenvolvido por João Vitor Duarte Antunes
        </p>
      </div>
    );
  }

  // Render Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4 animate-fade-in relative">
      <div className="absolute top-4 left-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedModule(null)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedModule === 'epi' ? 'bg-orange-500/10' : 'bg-primary/10'}`}>
              {selectedModule === 'epi' ? (
                <HardHat className={`w-8 h-8 ${selectedModule === 'epi' ? 'text-orange-500' : 'text-primary'}`} />
              ) : (
                <img src={logo} alt="Rex Logo" className="w-10 h-10 object-contain" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            {selectedModule === 'epi' ? 'Rex EPI' : 'Rex Materiais'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Criar nova conta de usuário" : `Acesso ao módulo de ${selectedModule === 'epi' ? 'EPIs' : 'Materiais'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ex: e149958"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, username: undefined }));
                }}
                disabled={isLoading}
                required
                className={validationErrors.username ? "border-destructive" : ""}
              />
              {validationErrors.username && (
                <p className="text-sm text-destructive">{validationErrors.username}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, password: undefined }));
                }}
                disabled={isLoading}
                required
                className={validationErrors.password ? "border-destructive" : ""}
              />
              {validationErrors.password && (
                <p className="text-sm text-destructive">{validationErrors.password}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className={`w-full transition-all duration-200 hover:scale-105 ${selectedModule === 'epi' ? 'bg-orange-500 hover:bg-orange-600' : ''}`} 
              disabled={isLoading}
            >
              {isLoading ? (isSignUp ? "Cadastrando..." : "Entrando...") : (isSignUp ? "Cadastrar" : "Entrar")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full transition-all duration-200"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setValidationErrors({});
              }}
              disabled={isLoading}
            >
              {isSignUp ? "Já tenho conta" : "Criar nova conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;