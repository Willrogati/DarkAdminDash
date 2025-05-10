import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { ChevronDown } from "lucide-react";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get user initials for avatar fallback
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex items-center space-x-3 focus:outline-none">
        <div className="flex-shrink-0">
          <Avatar>
            <AvatarImage src={user?.photoURL || undefined} alt="User avatar" />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="text-left hidden md:block">
          <span className="text-sm font-medium text-foreground">
            {user?.displayName || "Usuário"}
          </span>
          <span className="text-xs block text-muted-foreground">{user?.email}</span>
        </div>
        <ChevronDown className="h-5 w-5 text-muted-foreground hidden md:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="cursor-pointer">Seu perfil</DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">Configurações</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
