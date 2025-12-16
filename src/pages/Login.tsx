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
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ username?: string; password?: string }>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, isLoading: isAuthLoading } = useAuth();

  // Redirecionamento automático baseado no papel
  useEffect(() => {
    if (!isAuthLoading && user && role) {
      handleRedirect(role);
    }
  }, [user, role, isAuthLoading, navigate]);

  const handleRedirect = (userRole: string) => {
    switch (userRole) {
      case "admin":
        navigate("/admin", { replace: true });
        break;
      case "safety_tech":
        navigate("/epi/dashboard", { replace: true });
        break;
      case "almoxarifado":
        navigate("/stock/dashboard", { replace: true });
        break;
      case "pcm":
        navigate("/inbox", { replace: true });
        break;
      case "mechanic":
        // Mecânico vai para a seleção de módulos para escolher entre Materiais ou EPI
        navigate("/modules", { replace: true });
        break;
      default:
        // Fallback
        navigate("/modules", { replace: true });
        break;
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
    
    if (!validateForm()) return;
    
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
        setIsLoading(false); // Parar loading no cadastro
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Usuário ou senha incorretos");
          }
          throw signInError;
        }
        
        // Não paramos o loading aqui para evitar que o formulário volte a ficar editável 
        // antes do redirecionamento do useEffect acontecer
        toast({
          title: "Login realizado!",
          description: "Aguarde o redirecionamento...",
        });
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Erro ao cadastrar" : "Erro ao fazer login",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4 animate-fade-in relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <img src={logo} alt="Rex Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Rex</CardTitle>
          <CardDescription>
            {isSignUp ? "Criar nova conta de usuário" : "Sistema de Requisição de Materiais"}
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
              className="w-full transition-all duration-200 hover:scale-105"
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