import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Code, 
  Home, 
  User, 
  Settings, 
  Users, 
  BarChart, 
  FileText, 
  Bell, 
  LogOut,
  Youtube,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Lista de navegação principal
  const mainNavItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Youtube, label: "YouTube", path: "/youtube/search" },
    { icon: BarChart, label: "Estatísticas", path: "/statistics" },
    { icon: Users, label: "Usuários", path: "/users" },
  ];

  // Lista de navegação secundária
  const secondaryNavItems = [
    { icon: User, label: "Perfil", path: "/profile" },
    { icon: Bell, label: "Notificações", path: "/notifications" },
    { icon: Settings, label: "Configurações", path: "/settings" },
    { icon: FileText, label: "Documentação", path: "/docs" },
  ];

  // Obter iniciais do usuário para o Avatar
  const getUserInitials = () => {
    if (!user?.displayName) return "U";
    return user.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div 
      className={cn(
        "flex flex-col w-64 bg-card border-r border-border transition-all duration-300",
        className
      )}
    >
      {/* Header com logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 mr-3">
            <Code className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
        </div>
      </div>

      {/* Perfil do usuário resumido */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.photoURL || undefined} alt="Foto de perfil" />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.displayName || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu principal */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <h2 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Principal
          </h2>
        </div>
        <nav className="px-2 space-y-1 mb-6">
          {mainNavItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator className="mx-2 my-2" />

        <div className="px-3 mb-2 mt-4">
          <h2 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Configurações
          </h2>
        </div>
        <nav className="px-2 space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Botão de logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
}
