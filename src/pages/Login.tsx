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
import { HardHat, Wrench } from "lucide-react";

type ModuleType = "materials" | "epi" | null;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ username?: string; password?: string }>({});
  const [selectedModule, setSelectedModule] = useState<ModuleType>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        handleRedirect(session.user.id);
      }
    };
    checkSession();
  }, [navigate]);

  const handleRedirect = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const role = roleData?.role;

    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "pcm") {
      navigate("/inbox", { replace: true });
    } else if (role === "tecnico_seguranca") {
      navigate("/epi/safety-dashboard", { replace: true });
    } else if (role === "almoxarifado") {
      navigate("/epi/warehouse", { replace: true });
    } else {
      // For standard users (mechanics/others), route based on selection or default
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
          throw new Error("Usuário ou senha incorretos");
        }

        if (authData.user) {
          toast({
            title: "Login realizado!",
            description: `Bem-vindo ao módulo ${selectedModule === 'epi' ? 'EPI' : 'Manutenção'}!`,
          });
          await handleRedirect(authData.user.id);
        }
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

  if (!selectedModule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4 animate-fade-in relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[100px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[100px]" />
        </div>

        <Card className="w-full max-w-2xl shadow-xl animate-scale-in z-10 border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="flex justify-center mb-4">
               <img src={logo} alt="Rex Logo" className="w-24 h-24 object-contain drop-shadow-md" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Bem-vindo ao Rex</CardTitle>
            <CardDescription className="text-lg">
              Selecione o módulo que deseja acessar
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 p-8">
            <button
              onClick={() => setSelectedModule("materials")}
              className="group relative flex flex-col items-center justify-center p-8 h-64 rounded-xl border-2 border-muted bg-card hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="mb-6 p-4 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Wrench className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Requisições de Materiais</h3>
              <p className="text-sm text-muted-foreground text-center">
                Peças, ferramentas e insumos para manutenção.
              </p>
            </button>

            <button
              onClick={() => setSelectedModule("epi")}
              className="group relative flex flex-col items-center justify-center p-8 h-64 rounded-xl border-2 border-muted bg-card hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="mb-6 p-4 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 dark:bg-blue-900 dark:text-blue-300">
                <HardHat className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Requisições de EPI</h3>
              <p className="text-sm text-muted-foreground text-center">
                Equipamentos de proteção individual e segurança.
              </p>
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4 animate-fade-in relative">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={() => setSelectedModule(null)} className="gap-2">
          ← Voltar
        </Button>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className={`w-full max-w-md shadow-lg animate-scale-in border-t-4 ${selectedModule === 'epi' ? 'border-t-blue-500' : 'border-t-primary'}`}>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {selectedModule === 'epi' ? (
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <HardHat className="w-12 h-12" />
              </div>
            ) : (
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Wrench className="w-12 h-12" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {selectedModule === 'epi' ? 'Área de Segurança' : 'Área de Manutenção'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Criar nova conta de usuário" : "Faça login para continuar"}
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
              className={`w-full transition-all duration-200 hover:scale-105 ${selectedModule === 'epi' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
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