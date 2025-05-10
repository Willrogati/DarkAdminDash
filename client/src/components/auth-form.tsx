import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";
import { Code } from "lucide-react";

export function AuthForm() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  const handleToggleForm = () => {
    setActiveTab(activeTab === "login" ? "register" : "login");
  };

  return (
    <div className="w-full max-w-md mx-auto fade-in">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Code className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Faça login para acessar seu painel</p>
      </div>

      {/* Authentication Forms Container */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onToggleForm={handleToggleForm} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onToggleForm={handleToggleForm} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
