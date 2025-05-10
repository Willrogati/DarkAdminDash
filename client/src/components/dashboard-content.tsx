import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  PlusCircle, 
  Users, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertCircle 
} from "lucide-react";

export function DashboardContent() {
  const { user } = useAuth();

  const handleAddWidget = () => {
    alert("Funcionalidade de adicionar widget será implementada em breve!");
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Bom dia";
    if (hours < 18) return "Boa tarde";
    return "Boa noite";
  };

  const stats = [
    { 
      title: "Usuários", 
      value: "1.234", 
      trend: "+12%", 
      trend_type: "up", 
      description: "Usuários ativos",
      icon: Users,
      color: "bg-blue-500/10 text-blue-500"
    },
    { 
      title: "Sessões", 
      value: "6.521", 
      trend: "+24%", 
      trend_type: "up", 
      description: "Sessões hoje",
      icon: BarChart3,
      color: "bg-green-500/10 text-green-500"
    },
    { 
      title: "Taxa de Conversão", 
      value: "3.4%", 
      trend: "-2%", 
      trend_type: "down", 
      description: "Comparado com ontem",
      icon: TrendingUp,
      color: "bg-red-500/10 text-red-500"
    }
  ];

  const recentActivity = [
    { message: "Novo usuário registrado", time: "Há 5 minutos" },
    { message: "Atualização do sistema concluída", time: "Há 30 minutos" },
    { message: "Backup do banco de dados realizado", time: "Há 2 horas" }
  ];

  const notifications = [
    { message: "Manutenção programada para amanhã", priority: "high" },
    { message: "Atualização de segurança disponível", priority: "medium" }
  ];

  return (
    <div className="space-y-8">
      {/* Header/Greeting Card */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold">
            {getGreeting()}, {user?.displayName?.split(' ')[0] || "Usuário"}
          </CardTitle>
          <CardDescription>
            Bem-vindo ao seu painel de controle. Aqui está o resumo de hoje.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs mt-1">
                <span className={stat.trend_type === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.trend}
                </span>
                <span className="text-muted-foreground ml-2">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
            <CardDescription>O que aconteceu recentemente no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-xs">Ver todas as atividades</Button>
          </CardFooter>
        </Card>

        {/* Notifications */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Notificações</CardTitle>
            <CardDescription>Alertas e notificações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((notification, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${notification.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.priority === 'high' ? 'Alta prioridade' : 'Média prioridade'}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-xs">Ver todas as notificações</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Add Widget Card */}
      <Card className="border-dashed border-border border-2 bg-transparent">
        <CardContent className="flex flex-col items-center text-center p-6">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
            <PlusCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Adicionar novo widget
          </h2>
          <p className="text-muted-foreground mb-6">
            Personalize seu dashboard com widgets adicionais
          </p>
          <Button onClick={handleAddWidget}>
            Adicionar Widget
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
