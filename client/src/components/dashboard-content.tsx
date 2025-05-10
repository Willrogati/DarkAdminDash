import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function DashboardContent() {
  const handleAddWidget = () => {
    alert("Funcionalidade de adicionar widget será implementada em breve!");
  };

  return (
    <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
      {/* Empty Dashboard Card */}
      <div className="col-span-full bg-card rounded-xl shadow-md p-6 border border-border">
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
            <PlusCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Seu dashboard está vazio
          </h2>
          <p className="text-muted-foreground mb-6">
            Adicione widgets e conteúdo para personalizar seu painel administrativo.
          </p>
          <Button onClick={handleAddWidget}>
            Adicionar Widget
          </Button>
        </div>
      </div>
    </div>
  );
}
