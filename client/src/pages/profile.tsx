import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Loader2 } from "lucide-react";

// Schema para edição de perfil
const profileSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }).optional(),
  imageUrl: z
    .string()
    .url({ message: "URL inválida" })
    .nullable()
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, userData: firestoreUser, loading, updateUserProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Buscar dados do usuário do backend
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users", user?.uid],
    queryFn: async ({ queryKey }) => {
      if (!user?.uid) return null;
      const [_basePath, userId] = queryKey;
      return apiRequest(`/api/users/${userId}`);
    },
    enabled: !!user?.uid,
  });

  // Mutation para atualizar dados do usuário
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileFormValues) => {
      if (!user?.uid) throw new Error("Usuário não autenticado");
      
      const token = await user.getIdToken();
      
      return apiRequest(`/api/users/${user.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.uid] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível atualizar suas informações",
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData?.name || user?.displayName || "",
      email: userData?.email || user?.email || "",
      imageUrl: userData?.imageUrl || user?.photoURL || null,
    },
  });

  // Atualizar valores do formulário quando os dados do usuário são carregados
  useEffect(() => {
    if (userData) {
      reset({
        name: userData.name || user?.displayName || "",
        email: userData.email || user?.email || "",
        imageUrl: userData.imageUrl || user?.photoURL || null,
      });
    }
  }, [userData, user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getUserInitials = () => {
    const name = userData?.name || user?.displayName || "Usuário";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex w-full min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6">
          <Header toggleMobileMenu={() => setIsMobileMenuOpen(true)} />

          <div className="max-w-4xl mx-auto mt-8">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-2xl">Seu Perfil</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais e como elas são exibidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Avatar section */}
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                      {isLoadingUser ? (
                        <Skeleton className="w-24 h-24 rounded-full" />
                      ) : (
                        <Avatar className="w-24 h-24 border-2 border-border">
                          <AvatarImage src={userData?.imageUrl || user.photoURL || undefined} alt="Foto de perfil" />
                          <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                      <h3 className="text-xl font-medium">{isLoadingUser ? <Skeleton className="h-7 w-48" /> : (userData?.name || user.displayName || "Usuário")}</h3>
                      <p className="text-muted-foreground flex items-center justify-center md:justify-start">
                        {isLoadingUser ? (
                          <Skeleton className="h-5 w-64" />
                        ) : (
                          <>
                            <BadgeCheck className="w-4 h-4 mr-1 text-primary" />
                            {userData?.email || user.email}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Form section */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            placeholder="Seu nome completo"
                            {...register("name")}
                            className="bg-accent border-border"
                          />
                          {errors.name && (
                            <p className="text-destructive text-xs">{errors.name.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            placeholder="seu@email.com"
                            {...register("email")}
                            disabled
                            className="bg-accent border-border text-muted-foreground"
                          />
                          <p className="text-xs text-muted-foreground">
                            O email não pode ser alterado
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL da foto de perfil</Label>
                        <Input
                          id="imageUrl"
                          placeholder="https://exemplo.com/sua-foto.jpg"
                          {...register("imageUrl")}
                          className="bg-accent border-border"
                        />
                        {errors.imageUrl && (
                          <p className="text-destructive text-xs">{errors.imageUrl.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Insira a URL de uma imagem online para usar como foto de perfil
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!isDirty || updateProfileMutation.isPending || isLoadingUser}
                        className="min-w-32"
                      >
                        {updateProfileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {updateProfileMutation.isPending ? "Salvando..." : "Salvar alterações"}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}