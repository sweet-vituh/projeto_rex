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

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ username?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (roleData?.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (roleData?.role === "pcm") {
          navigate("/inbox", { replace: true });
        } else if (roleData?.role === "mechanic") {
          navigate("/home", { replace: true });
        }
      }
    };
    checkSession();
  }, [navigate]);

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
      // Convert username to email format
      const email = `${username.toLowerCase().trim()}@company.local`;

      if (isSignUp) {
        // Create account - ALWAYS as mechanic (security fix)
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`
          }
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            throw new Error("Este usuário já está cadastrado");
          }
          throw signUpError;
        }

        // Create role entry using secure RPC function - always creates as mechanic
        if (authData.user) {
          const { error: roleError } = await supabase.rpc('create_user_role', {
            _user_id: authData.user.id,
            _username: username.trim()
          });

          if (roleError) {
            // If role creation fails, we should clean up the auth user
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
        // Login
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

        // Fetch user role from database (server-side source of truth)
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role, username")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (roleError) throw roleError;

        // Verify user has a role
        if (!roleData) {
          await supabase.auth.signOut();
          throw new Error("Usuário não autorizado");
        }

        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao Rex!",
        });

        // Redirect based on role from database
        if (roleData.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (roleData.role === "pcm") {
          navigate("/inbox", { replace: true });
        } else {
          navigate("/home", { replace: true });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4 animate-fade-in relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Rex Logo" className="w-20 h-20 object-contain" />
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
            <Button type="submit" className="w-full transition-all duration-200 hover:scale-105" disabled={isLoading}>
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
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Desenvolvido por João Vitor Duarte Antunes
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;