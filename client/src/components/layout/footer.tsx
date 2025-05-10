import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card p-4 md:p-6 border-t border-border">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Admin Dashboard. Todos os direitos reservados.
          </p>
        </div>
        <div className="mt-3 md:mt-0 flex justify-center md:justify-end space-x-4">
          <Link href="/terms">
            <a className="text-muted-foreground hover:text-foreground text-sm">Termos</a>
          </Link>
          <Link href="/privacy">
            <a className="text-muted-foreground hover:text-foreground text-sm">Privacidade</a>
          </Link>
          <Link href="/help">
            <a className="text-muted-foreground hover:text-foreground text-sm">Ajuda</a>
          </Link>
        </div>
      </div>
    </footer>
  );
}
