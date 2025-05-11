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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Youtube, 
  ArrowLeft, 
  Eye, 
  ThumbsUp,
  User2,
  BookmarkPlus,
  Calendar,
  ExternalLink,
  FileText,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

// Tipo para segmento de transcrição
type TranscriptionSegment = {
  text: string;
  time?: string;
};

// Tipo para resposta de transcrição
type TranscriptionResponse = {
  videoId: string;
  transcription: TranscriptionSegment[];
  segmentsCount: number;
};

export default function YouTubeVideo() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { videoId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Consulta de detalhes do vídeo
  const { 
    data: videoDetails,
    isLoading: isLoadingVideo,
    error
  } = useQuery({
    queryKey: ["youtube-video", videoId],
    queryFn: async () => {
      if (!videoId) return null;
      return await apiRequest<YouTubeVideoDetails>(`/api/youtube/videos/${videoId}`);
    },
    enabled: !!videoId // Executar apenas se tivermos o ID do vídeo
  });
  
  // Consulta de transcrição do vídeo
  const {
    data: transcriptionData,
    isLoading: isLoadingTranscription,
    refetch: fetchTranscription,
    error: transcriptionError
  } = useQuery({
    queryKey: ["youtube-transcription", videoId],
    queryFn: async () => {
      if (!videoId) return null;
      return await apiRequest<TranscriptionResponse>(`/api/youtube/videos/${videoId}/transcription`);
    },
    enabled: false // Não executar automaticamente, apenas quando solicitado
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatNumber = (num?: number) => {
    if (num === undefined) return "N/A";
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const handleGoBack = () => {
    setLocation("/youtube/search");
  };

  const handleSaveVideo = async () => {
    if (!videoDetails || !user) return;
    
    try {
      await apiRequest('/api/youtube/videos/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer token`
        },
        body: JSON.stringify({
          id: videoDetails.id,
          title: videoDetails.title,
          description: videoDetails.description,
          thumbnailUrl: videoDetails.thumbnailUrl,
          channelId: videoDetails.channelId,
          channelTitle: videoDetails.channelTitle,
          publishedAt: videoDetails.publishedAt,
          viewCount: videoDetails.viewCount,
          likeCount: videoDetails.likeCount,
          userId: user.uid
        })
      });
      
      toast({
        title: "Vídeo salvo",
        description: "O vídeo foi adicionado aos seus favoritos.",
      });
    } catch (error) {
      console.error("Erro ao salvar vídeo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o vídeo.",
        variant: "destructive",
      });
    }
  };
  
  const handleGetTranscription = async () => {
    try {
      setShowTranscription(true);
      
      toast({
        title: "Obtendo transcrição",
        description: "Isso pode levar alguns segundos...",
      });
      
      await fetchTranscription();
    } catch (error) {
      console.error("Erro ao obter transcrição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível obter a transcrição do vídeo.",
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
                onClick={handleSaveVideo}
                disabled={isLoadingVideo || !videoDetails}
              >
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Salvar vídeo
              </Button>
            </div>

            {isLoadingVideo ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <Card className="border-border">
                <CardContent className="text-center py-12">
                  <p className="text-red-500 mb-2">Erro ao carregar detalhes do vídeo</p>
                  <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
                  <Button className="mt-4" onClick={handleGoBack}>
                    Voltar para a pesquisa
                  </Button>
                </CardContent>
              </Card>
            ) : videoDetails ? (
              <>
                {/* Player de vídeo embutido */}
                <div className="rounded-lg overflow-hidden aspect-video w-full">
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title={videoDetails.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>

                {/* Detalhes do vídeo */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{videoDetails.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>{formatNumber(videoDetails.viewCount)} visualizações</span>
                          </div>
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            <span>{formatNumber(videoDetails.likeCount)} curtidas</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Publicado em {formatDate(videoDetails.publishedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir no YouTube
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-4">
                    <div 
                      className="cursor-pointer hover:bg-muted/40 transition-colors p-3 rounded-md flex items-center mb-6"
                      onClick={() => setLocation(`/youtube/channels/${videoDetails.channelId}`)}
                    >
                      <User2 className="h-10 w-10 text-blue-500 mr-3" />
                      <div>
                        <h3 className="font-semibold">{videoDetails.channelTitle}</h3>
                        <p className="text-sm text-muted-foreground">Clique para ver o canal</p>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {videoDetails.description || "Sem descrição disponível."}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-border">
                <CardContent className="text-center py-12">
                  <p>Nenhum vídeo encontrado.</p>
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