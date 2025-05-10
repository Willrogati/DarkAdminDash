import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Youtube, 
  ArrowLeft, 
  Users, 
  PlayCircle,
  BookmarkPlus,
  ExternalLink,
  PlaySquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Tipo para os detalhes do canal
type YouTubeChannelDetails = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: number;
  videoCount?: number;
};

// Tipo para os detalhes do vídeo
type YouTubeVideoDetails = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  viewCount?: number;
  likeCount?: number;
};

export default function YouTubeChannel() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { channelId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Consulta de detalhes do canal
  const { 
    data: channelDetails,
    isLoading: isLoadingChannel,
    error: channelError
  } = useQuery({
    queryKey: ["youtube-channel", channelId],
    queryFn: async () => {
      if (!channelId) return null;
      return await apiRequest<YouTubeChannelDetails>(`/api/youtube/channels/${channelId}`);
    },
    enabled: !!channelId // Executar apenas se tivermos o ID do canal
  });

  // Consulta de vídeos do canal
  const { 
    data: channelVideos,
    isLoading: isLoadingVideos,
    error: videosError
  } = useQuery({
    queryKey: ["youtube-channel-videos", channelId],
    queryFn: async () => {
      if (!channelId) return [];
      return await apiRequest<YouTubeVideoDetails[]>(`/api/youtube/channels/${channelId}/videos?maxResults=20`);
    },
    enabled: !!channelId // Executar apenas se tivermos o ID do canal
  });

  const formatNumber = (num?: number) => {
    if (num === undefined) return "N/A";
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutos atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} meses atrás`;
    
    return `${Math.floor(diffInSeconds / 31536000)} anos atrás`;
  };

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  const handleGoBack = () => {
    setLocation("/youtube/search");
  };

  const handleSaveChannel = async () => {
    if (!channelDetails || !user) return;
    
    try {
      await apiRequest('/api/youtube/channels/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer token`
        },
        body: JSON.stringify({
          id: channelDetails.id,
          title: channelDetails.title,
          description: channelDetails.description,
          thumbnailUrl: channelDetails.thumbnailUrl,
          subscriberCount: channelDetails.subscriberCount,
          videoCount: channelDetails.videoCount,
          userId: user.uid
        })
      });
      
      toast({
        title: "Canal salvo",
        description: "O canal foi adicionado aos seus favoritos.",
      });
    } catch (error) {
      console.error("Erro ao salvar canal:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o canal.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex w-full min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6">
          <Header toggleMobileMenu={() => setIsMobileMenuOpen(true)} />
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para a pesquisa
              </Button>
              <div className="flex-1" />
              <Button 
                variant="outline"
                onClick={handleSaveChannel}
                disabled={isLoadingChannel || !channelDetails}
              >
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Salvar canal
              </Button>
            </div>

            {isLoadingChannel ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : channelError ? (
              <Card className="border-border">
                <CardContent className="text-center py-12">
                  <p className="text-red-500 mb-2">Erro ao carregar detalhes do canal</p>
                  <p className="text-sm text-muted-foreground">{(channelError as Error).message}</p>
                  <Button className="mt-4" onClick={handleGoBack}>
                    Voltar para a pesquisa
                  </Button>
                </CardContent>
              </Card>
            ) : channelDetails ? (
              <>
                {/* Banner e Detalhes do Canal */}
                <Card className="border-border overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-900 h-32 md:h-48"></div>
                  <CardContent className="pt-0">
                    <div className="flex flex-col md:flex-row md:items-end -mt-10 md:-mt-16 mb-6">
                      <div className="rounded-full overflow-hidden border-4 border-background w-24 h-24 md:w-32 md:h-32 bg-muted flex-shrink-0">
                        {channelDetails.thumbnailUrl ? (
                          <img 
                            src={channelDetails.thumbnailUrl}
                            alt={channelDetails.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Users className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="mt-4 md:mt-0 md:ml-6 md:mb-2">
                        <h2 className="text-2xl font-bold">{channelDetails.title}</h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{formatNumber(channelDetails.subscriberCount)} inscritos</span>
                          </div>
                          <div className="flex items-center">
                            <PlaySquare className="h-4 w-4 mr-1" />
                            <span>{formatNumber(channelDetails.videoCount)} vídeos</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 md:text-right mt-4 md:mt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`https://www.youtube.com/channel/${channelId}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver no YouTube
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 border-t pt-4">
                      <h3 className="font-semibold mb-2">Sobre o canal</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {channelDetails.description || "Sem descrição disponível."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Vídeos do Canal */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Vídeos recentes</CardTitle>
                    <CardDescription>
                      {isLoadingVideos 
                        ? "Carregando vídeos..."
                        : channelVideos?.length
                          ? `${channelVideos.length} vídeos mais recentes`
                          : "Nenhum vídeo encontrado"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingVideos ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : videosError ? (
                      <div className="text-center py-8">
                        <p className="text-red-500 mb-2">Erro ao carregar vídeos</p>
                        <p className="text-sm text-muted-foreground">{(videosError as Error).message}</p>
                      </div>
                    ) : channelVideos?.length === 0 ? (
                      <div className="text-center py-8">
                        <p>Este canal não possui vídeos disponíveis.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {channelVideos?.map((video) => (
                          <Card 
                            key={video.id} 
                            className="overflow-hidden cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => setLocation(`/youtube/videos/${video.id}`)}
                          >
                            <div className="relative">
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title}
                                className="w-full aspect-video object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayCircle className="h-12 w-12 text-white" />
                              </div>
                            </div>
                            <CardContent className="p-3">
                              <h3 className="font-medium text-sm line-clamp-2 mb-1">
                                {video.title}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {getRelativeTime(video.publishedAt)}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-border">
                <CardContent className="text-center py-12">
                  <p>Nenhum canal encontrado.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}