import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Youtube, 
  Search, 
  Clock, 
  PlayCircle, 
  User2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Tipo para os resultados da pesquisa
type YouTubeSearchResult = {
  id: string;
  type: 'video' | 'channel';
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt?: string;
  channelId?: string;
  channelTitle?: string;
};

export default function YouTubeSearch() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchPerformed, setSearchPerformed] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Consulta de pesquisa
  const { 
    data: searchResults,
    isLoading: isSearching,
    refetch: refetchSearch,
    error
  } = useQuery({
    queryKey: ["youtube-search", searchQuery, activeTab],
    queryFn: async () => {
      if (!searchQuery) return { results: [] };
      const type = activeTab === "all" ? "all" : activeTab === "videos" ? "video" : "channel";
      const results = await apiRequest<YouTubeSearchResult[]>(`/api/youtube/search?query=${encodeURIComponent(searchQuery)}&type=${type}&maxResults=25`);
      return { results: results || [] };
    },
    enabled: false // Não executar automaticamente
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      refetchSearch();
      setSearchPerformed(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "";
    
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

  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
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
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Youtube className="h-6 w-6 text-red-500" />
                  <CardTitle className="text-xl">Pesquisar no YouTube</CardTitle>
                </div>
                <CardDescription>
                  Busque vídeos e canais para analisar seu conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barra de pesquisa */}
                <div className="flex w-full max-w-full items-center space-x-2">
                  <Input
                    type="search"
                    placeholder="Pesquisar vídeos ou canais..."
                    className="flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />
                  <Button 
                    type="submit" 
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Pesquisar
                  </Button>
                </div>

                {/* Filtros de pesquisa */}
                <Tabs 
                  defaultValue="all" 
                  className="w-full"
                  value={activeTab}
                  onValueChange={(value) => {
                    setActiveTab(value);
                    if (searchPerformed) {
                      refetchSearch();
                    }
                  }}
                >
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="videos">Vídeos</TabsTrigger>
                    <TabsTrigger value="channels">Canais</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Resultados da Pesquisa */}
            {searchPerformed && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Resultados para "{searchQuery}"</CardTitle>
                  <CardDescription>
                    {isSearching 
                      ? "Buscando..." 
                      : searchResults?.results?.length 
                        ? `${searchResults.results.length} resultados encontrados` 
                        : "Nenhum resultado encontrado"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSearching ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-500">
                      <p>Erro ao buscar resultados. Por favor, tente novamente.</p>
                      <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(searchResults?.results?.length === 0 && searchPerformed) ? (
                        <div className="text-center py-8">
                          <p>Nenhum resultado encontrado para "{searchQuery}".</p>
                          <p className="text-sm text-muted-foreground">Tente termos diferentes ou mais genéricos.</p>
                        </div>
                      ) : (
                        searchResults?.results?.map((result) => (
                          <Card 
                            key={result.id} 
                            className="overflow-hidden cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => {
                              if (result.type === 'video') {
                                setLocation(`/youtube/videos/${result.id}`);
                              } else {
                                setLocation(`/youtube/channels/${result.id}`);
                              }
                            }}
                          >
                            <CardContent className="p-0">
                              <div className="flex flex-col md:flex-row">
                                {/* Thumbnail */}
                                <div className="md:w-56 lg:w-72 h-auto">
                                  <img 
                                    src={result.thumbnailUrl} 
                                    alt={result.title}
                                    className="w-full h-full object-cover aspect-video"
                                  />
                                </div>
                                
                                {/* Conteúdo */}
                                <div className="p-4 flex-1">
                                  <div className="flex items-start gap-2">
                                    {result.type === 'video' ? (
                                      <PlayCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <User2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div>
                                      <h3 className="font-semibold text-base">
                                        {result.title}
                                      </h3>
                                      <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
                                        {result.type === 'video' && (
                                          <>
                                            <span>{result.channelTitle}</span>
                                            <span>•</span>
                                          </>
                                        )}
                                        <div className="flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          <span>{getRelativeTime(result.publishedAt)}</span>
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {truncateDescription(result.description)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
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