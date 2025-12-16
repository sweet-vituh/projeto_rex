import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Search, 
  Shield, 
  Users, 
  RefreshCw, 
  UserCog, 
  Package, 
  HardHat, 
  Warehouse
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RexLogo } from "@/components/RexLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogManager } from "@/components/admin/CatalogManager";

type RoleType = "mechanic" | "pcm" | "admin" | "safety_tech" | "almoxarifado";

interface UserRole {
  id: string;
  user_id: string;
  username: string;
  role: RoleType;
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
  
  // State for Role Edit Dialog
  const [editRoleDialog, setEditRoleDialog] = useState<{
    open: boolean;
    userId: string;
    username: string;
    currentRole: RoleType;
  } | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<RoleType | "">("");

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

  const openEditDialog = (user: UserRole) => {
    setEditRoleDialog({
      open: true,
      userId: user.user_id,
      username: user.username,
      currentRole: user.role
    });
    setSelectedNewRole(user.role);
  };

  const handleRoleUpdate = async () => {
    if (!editRoleDialog || !selectedNewRole) return;

    if (editRoleDialog.currentRole === selectedNewRole) {
      setEditRoleDialog(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: selectedNewRole })
        .eq('user_id', editRoleDialog.userId);

      if (error) throw error;

      toast({
        title: "Função atualizada!",
        description: `O usuário ${editRoleDialog.username} agora é ${getRoleLabel(selectedNewRole)}.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar função",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEditRoleDialog(null);
      setSelectedNewRole("");
    }
  };

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case 'admin': return 'default';
      case 'pcm': return 'secondary';
      case 'safety_tech': return 'secondary'; // Using secondary for specialized roles
      case 'almoxarifado': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (userRole: string) => {
    switch (userRole) {
      case 'admin': return 'Admin';
      case 'pcm': return 'PCM';
      case 'safety_tech': return 'Téc. Segurança';
      case 'almoxarifado': return 'Almoxarifado';
      default: return 'Mecânico';
    }
  };

  const stats = {
    mechanic: users.filter(u => u.role === 'mechanic').length,
    pcm: users.filter(u => u.role === 'pcm').length,
    safety_tech: users.filter(u => u.role === 'safety_tech').length,
    almoxarifado: users.filter(u => u.role === 'almoxarifado').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

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
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Filtrar por função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Funções</SelectItem>
                    <SelectItem value="mechanic">Mecânico</SelectItem>
                    <SelectItem value="pcm">PCM</SelectItem>
                    <SelectItem value="safety_tech">Téc. Segurança</SelectItem>
                    <SelectItem value="almoxarifado">Almoxarifado</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xl font-bold">{stats.mechanic}</p>
                  <p className="text-xs text-muted-foreground">Mecânicos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <UserCog className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-xl font-bold">{stats.pcm}</p>
                  <p className="text-xs text-muted-foreground">PCM</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <HardHat className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                  <p className="text-xl font-bold">{stats.safety_tech}</p>
                  <p className="text-xs text-muted-foreground">Téc. Seg.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Warehouse className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                  <p className="text-xl font-bold">{stats.almoxarifado}</p>
                  <p className="text-xs text-muted-foreground">Almox.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-xl font-bold">{stats.admin}</p>
                  <p className="text-xs text-muted-foreground">Admins</p>
                </CardContent>
              </Card>
            </div>

            {/* Users List */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
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
                            ID: {user.username}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {user.role === 'admin' ? (
                             <Badge variant="secondary" className="h-9 px-3 flex items-center">
                              <Shield className="w-4 h-4 mr-1" />
                              Protegido
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(user)}
                              className="transition-all duration-200"
                            >
                              <UserCog className="w-4 h-4 mr-1" />
                              Alterar Função
                            </Button>
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

      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleDialog} onOpenChange={(open) => !open && setEditRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Função do Usuário</DialogTitle>
            <DialogDescription>
              Defina o nível de acesso para <strong>{editRoleDialog?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Função</Label>
              <Select 
                value={selectedNewRole} 
                onValueChange={(value) => setSelectedNewRole(value as RoleType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanic">Mecânico (Padrão)</SelectItem>
                  <SelectItem value="pcm">PCM (Gestão de Manutenção)</SelectItem>
                  <SelectItem value="safety_tech">Técnico de Segurança (EPI)</SelectItem>
                  <SelectItem value="almoxarifado">Almoxarifado (Estoque)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
              <p className="font-semibold mb-1">Permissões:</p>
              <ul className="list-disc pl-4 space-y-1">
                {selectedNewRole === 'mechanic' && <li>Pode criar requisições de materiais e EPIs.</li>}
                {selectedNewRole === 'pcm' && <li>Gerencia requisições de manutenção e aprova pedidos.</li>}
                {selectedNewRole === 'safety_tech' && <li>Gerencia aprovações de EPIs e visualiza dashboard de segurança.</li>}
                {selectedNewRole === 'almoxarifado' && <li>Gerencia estoque físico e registra movimentações.</li>}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialog(null)}>Cancelar</Button>
            <Button onClick={handleRoleUpdate} disabled={!selectedNewRole || selectedNewRole === editRoleDialog?.currentRole}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;