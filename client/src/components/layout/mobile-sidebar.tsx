import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  Home, 
  User, 
  Settings, 
  Users, 
  BarChart, 
  FileText, 
  Bell, 
  LogOut 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Lista de navegação principal
  const mainNavItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="p-0 bg-card w-[280px] max-w-full">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 mr-3">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold">Admin Dashboard</span>
          </SheetTitle>
        </SheetHeader>
        
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
        
        <div className="p-4 space-y-6">
          {/* Menu Principal */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Principal
            </h2>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={onClose}>
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
          </div>
          
          <Separator />
          
          {/* Menu Secundário */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Configurações
            </h2>
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={onClose}>
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
          
          <Separator />
          
          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
