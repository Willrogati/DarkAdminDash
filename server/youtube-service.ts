import { google, youtube_v3 } from 'googleapis';
import { z } from 'zod';

// Schema para validar a requisição de pesquisa
export const youtubeSearchSchema = z.object({
  query: z.string().min(1, "A consulta de pesquisa é obrigatória"),
  maxResults: z.number().optional().default(25),
  type: z.enum(['video', 'channel', 'all']).optional().default('all')
});

// Schema para validar a requisição de detalhes do vídeo
export const youtubeVideoDetailsSchema = z.object({
  videoId: z.string().min(1, "ID do vídeo é obrigatório")
});

// Schema para validar a requisição de detalhes do canal
export const youtubeChannelDetailsSchema = z.object({
  channelId: z.string().min(1, "ID do canal é obrigatório")
});

// Schema para validar a requisição de vídeos do canal
export const youtubeChannelVideosSchema = z.object({
  channelId: z.string().min(1, "ID do canal é obrigatório"),
  maxResults: z.number().optional().default(20)
});

// Tipo para os resultados da pesquisa
export type YouTubeSearchResult = {
  id: string;
  type: 'video' | 'channel';
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt?: string;
  channelId?: string;
  channelTitle?: string;
};

// Tipo para detalhes do vídeo
export type YouTubeVideoDetails = {
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

// Tipo para detalhes do canal
export type YouTubeChannelDetails = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: number;
  videoCount?: number;
};

export class YouTubeService {
  private youtube: youtube_v3.Youtube;

  constructor(apiKey: string) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
  }

  /**
   * Pesquisa vídeos ou canais no YouTube
   */
  async search(query: string, maxResults: number = 25, type: 'video' | 'channel' | 'all' = 'all'): Promise<YouTubeSearchResult[]> {
    try {
      const searchParams: youtube_v3.Params$Resource$Search$List = {
        part: ['snippet'],
        q: query,
        maxResults: maxResults,
        type: type !== 'all' ? [type] : ['video', 'channel']
      };

      const response = await this.youtube.search.list(searchParams);

      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }

      return response.data.items.map(item => {
        const itemType = 
          item.id?.videoId ? 'video' : 
          item.id?.channelId ? 'channel' : 
          'unknown';
          
        return {
          id: item.id?.videoId || item.id?.channelId || '',
          type: itemType as 'video' | 'channel',
          title: item.snippet?.title || '',
          description: item.snippet?.description || '',
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          publishedAt: item.snippet?.publishedAt || undefined,
          channelId: item.snippet?.channelId,
          channelTitle: item.snippet?.channelTitle
        };
      }).filter(item => item.type !== 'unknown' && item.id);
    } catch (error) {
      console.error('Erro ao pesquisar no YouTube:', error);
      throw new Error('Falha ao pesquisar no YouTube. Verifique sua chave de API e tente novamente.');
    }
  }

  /**
   * Obtém detalhes completos de um vídeo
   */
  async getVideoDetails(videoId: string): Promise<YouTubeVideoDetails> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: [videoId]
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Vídeo com ID ${videoId} não encontrado`);
      }

      const video = response.data.items[0];
      
      return {
        id: video.id || videoId,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        thumbnailUrl: 
          video.snippet?.thumbnails?.high?.url || 
          video.snippet?.thumbnails?.medium?.url || 
          video.snippet?.thumbnails?.default?.url || '',
        publishedAt: video.snippet?.publishedAt || '',
        channelId: video.snippet?.channelId || '',
        channelTitle: video.snippet?.channelTitle || '',
        viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : undefined,
        likeCount: video.statistics?.likeCount ? parseInt(video.statistics.likeCount) : undefined
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do vídeo:', error);
      throw new Error('Falha ao obter detalhes do vídeo. Verifique sua chave de API e tente novamente.');
    }
  }

  /**
   * Obtém detalhes completos de um canal
   */
  async getChannelDetails(channelId: string): Promise<YouTubeChannelDetails> {
    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics'],
        id: [channelId]
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error(`Canal com ID ${channelId} não encontrado`);
      }

      const channel = response.data.items[0];
      
      return {
        id: channel.id || channelId,
        title: channel.snippet?.title || '',
        description: channel.snippet?.description || '',
        thumbnailUrl: 
          channel.snippet?.thumbnails?.high?.url || 
          channel.snippet?.thumbnails?.medium?.url || 
          channel.snippet?.thumbnails?.default?.url || '',
        subscriberCount: channel.statistics?.subscriberCount ? parseInt(channel.statistics.subscriberCount) : undefined,
        videoCount: channel.statistics?.videoCount ? parseInt(channel.statistics.videoCount) : undefined
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do canal:', error);
      throw new Error('Falha ao obter detalhes do canal. Verifique sua chave de API e tente novamente.');
    }
  }

  /**
   * Obtém os vídeos de um canal específico
   */
  async getChannelVideos(channelId: string, maxResults: number = 20): Promise<YouTubeVideoDetails[]> {
    try {
      // Primeiro, obtemos o ID da playlist de uploads do canal
      const channelResponse = await this.youtube.channels.list({
        part: ['contentDetails'],
        id: [channelId]
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new Error(`Canal com ID ${channelId} não encontrado`);
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        throw new Error(`Não foi possível encontrar a playlist de uploads para o canal ${channelId}`);
      }

      // Agora, obtemos os vídeos da playlist de uploads
      const playlistResponse = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId: uploadsPlaylistId,
        maxResults: maxResults
      });

      if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
        return [];
      }

      // Extraímos os IDs dos vídeos
      const videoIds = playlistResponse.data.items
        .map(item => item.contentDetails?.videoId)
        .filter(id => id) as string[];

      if (videoIds.length === 0) {
        return [];
      }

      // Obtemos detalhes completos dos vídeos em lote
      const videosResponse = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: videoIds
      });

      if (!videosResponse.data.items) {
        return [];
      }

      return videosResponse.data.items.map(video => ({
        id: video.id || '',
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        thumbnailUrl: 
          video.snippet?.thumbnails?.high?.url || 
          video.snippet?.thumbnails?.medium?.url || 
          video.snippet?.thumbnails?.default?.url || '',
        publishedAt: video.snippet?.publishedAt || '',
        channelId: video.snippet?.channelId || channelId,
        channelTitle: video.snippet?.channelTitle || '',
        viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : undefined,
        likeCount: video.statistics?.likeCount ? parseInt(video.statistics.likeCount) : undefined
      }));
    } catch (error) {
      console.error('Erro ao obter vídeos do canal:', error);
      throw new Error('Falha ao obter vídeos do canal. Verifique sua chave de API e tente novamente.');
    }
  }
}

// Singleton para o serviço YouTube
let youtubeService: YouTubeService | null = null;

export function getYouTubeService(): YouTubeService {
  if (!youtubeService) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error('A chave de API do YouTube não foi configurada. Configure a variável de ambiente YOUTUBE_API_KEY.');
    }
    
    youtubeService = new YouTubeService(apiKey);
  }
  
  return youtubeService;
}