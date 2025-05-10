import { UserMenu } from "@/components/ui/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  toggleMobileMenu: () => void;
}

export function Header({ toggleMobileMenu }: HeaderProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Bem-vindo, {user?.displayName || "Usuário"}!
        </p>
      </div>

      <div className="mt-4 md:mt-0">
        <UserMenu />
      </div>
    </div>
  );
}
