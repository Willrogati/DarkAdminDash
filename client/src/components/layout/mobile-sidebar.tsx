import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Code, Home, User, Settings, HelpCircle, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: User, label: "Perfil", path: "/profile" },
    { icon: Settings, label: "Configurações", path: "/settings" },
    { icon: HelpCircle, label: "Ajuda", path: "/help" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="p-0 bg-card">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 mr-3">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold">Admin Dashboard</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
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
            
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </Button>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
