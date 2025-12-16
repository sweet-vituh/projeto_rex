import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Search, Shield, Users, RefreshCw, UserCheck, UserX, Package } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RexLogo } from "@/components/RexLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogManager } from "@/components/admin/CatalogManager";

interface UserRole {
  id: string;
  user_id: string;
  username: string;
  role: "mechanic" | "pcm" | "admin";
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { username: authUsername, signOut } = useAuth();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    username: string;
    newRole: "mechanic" | "pcm";
    action: "promote" | "demote";
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Erro ao carregar usuários",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setUsers(data as UserRole[]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, users]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleRoleChange = async () => {
    if (!confirmDialog) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: confirmDialog.newRole })
        .eq('user_id', confirmDialog.userId);

      if (error) throw error;

      toast({
        title: confirmDialog.action === "promote" ? "Usuário promovido!" : "Usuário rebaixado!",
        description: `${confirmDialog.username} agora é ${confirmDialog.newRole === 'pcm' ? 'PCM' : 'Mecânico'}`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar função",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConfirmDialog(null);
    }
  };

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'default';
      case 'pcm':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'Admin';
      case 'pcm':
        return 'PCM';
      default:
        return 'Mecânico';
    }
  };

  const mechanicCount = users.filter(u => u.role === 'mechanic').length;
  const pcmCount = users.filter(u => u.role === 'pcm').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <RexLogo />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground">Admin - {authUsername}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Catálogo de Itens
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Search & Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome de usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Filtrar por função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Funções</SelectItem>
                    <SelectItem value="mechanic">Mecânico</SelectItem>
                    <SelectItem value="pcm">PCM</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{mechanicCount}</p>
                  <p className="text-sm text-muted-foreground">Mecânicos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <UserCheck className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{pcmCount}</p>
                  <p className="text-sm text-muted-foreground">PCM</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{adminCount}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </CardContent>
              </Card>
            </div>

            {/* Users List */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="animate-fade-in">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold truncate">{user.username}</p>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {user.role === 'mechanic' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setConfirmDialog({
                                open: true,
                                userId: user.user_id,
                                username: user.username,
                                newRole: 'pcm',
                                action: 'promote'
                              })}
                              className="transition-all duration-200"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Promover a PCM
                            </Button>
                          )}
                          {user.role === 'pcm' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDialog({
                                open: true,
                                userId: user.user_id,
                                username: user.username,
                                newRole: 'mechanic',
                                action: 'demote'
                              })}
                              className="transition-all duration-200"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Rebaixar
                            </Button>
                          )}
                          {user.role === 'admin' && (
                            <Badge variant="secondary" className="h-9 px-3 flex items-center">
                              <Shield className="w-4 h-4 mr-1" />
                              Protegido
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Catalog Tab */}
          <TabsContent value="catalog">
            <CatalogManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'promote' ? 'Promover Usuário' : 'Rebaixar Usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'promote' 
                ? `Tem certeza que deseja promover ${confirmDialog?.username} para PCM? Ele terá acesso a todas as requisições.`
                : `Tem certeza que deseja rebaixar ${confirmDialog?.username} para Mecânico? Ele perderá acesso às funcionalidades de PCM.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
