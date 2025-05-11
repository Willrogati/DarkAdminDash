import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';

// Schema para validar a requisição de extração de transcrição
export const transcriptionRequestSchema = z.object({
  videoId: z.string().min(1, "ID do vídeo é obrigatório")
});

export interface TranscriptionSegment {
  text: string;
  time?: string;
}

export class ZyteService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Extrai a transcrição de um vídeo do YouTube
   * @param videoId ID do vídeo do YouTube
   * @returns Array com segmentos da transcrição
   */
  async getVideoTranscription(videoId: string): Promise<TranscriptionSegment[]> {
    try {
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      const response = await axios.post(
        'https://api.zyte.com/v1/extract',
        {
          url: youtubeUrl,
          browserHtml: true,
          actions: [
            // Espera o botão de menu (⋮)
            {
              action: "click",
              selector: "ytd-menu-renderer yt-icon-button",
              waitFor: "0.5s"
            },
            // Clica na opção "Mostrar transcrição"
            {
              action: "click",
              selector: "ytd-menu-service-item-renderer",
              waitFor: "2s"
            },
            // Espera o componente da transcrição aparecer
            {
              action: "waitForElement",
              selector: "ytd-transcript-renderer"
            }
          ]
        },
        {
          auth: {
            username: this.apiKey,
            password: ''
          },
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 90000 // 90 segundos de timeout para permitir o carregamento
        }
      );
      
      if (response.status !== 200) {
        throw new Error(`Erro ao fazer requisição para a API Zyte: ${response.status}`);
      }
      
      const result = response.data;
      const htmlContent = result.browserHtml || '';
      
      // Analisando o HTML com cheerio
      const $ = cheerio.load(htmlContent);
      const transcriptDivs = $('ytd-transcript-renderer div.cue-group');
      
      if (transcriptDivs.length === 0) {
        // Tente outro seletor caso o primeiro não encontre resultados
        const altTranscriptDivs = $('div.ytd-transcript-renderer');
        
        if (altTranscriptDivs.length === 0) {
          throw new Error('Não foi possível encontrar a transcrição para este vídeo.');
        }
      }
      
      const transcription: TranscriptionSegment[] = [];
      
      transcriptDivs.each((_, element) => {
        const timeNode = $(element).find('.cue-group-start-offset');
        const textNode = $(element).find('.cue');
        
        const time = timeNode.text().trim();
        const text = textNode.text().trim();
        
        if (text) {
          transcription.push({
            text,
            time: time || undefined
          });
        }
      });
      
      if (transcription.length === 0) {
        // Tente outro formato de extração se o primeiro não funcionar
        const textContent = $('ytd-transcript-renderer').text();
        if (textContent) {
          // Dividir por linhas e tentar extrair os segmentos
          const lines = textContent.split('\n').filter(line => line.trim());
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              // Tentar extrair o tempo (geralmente no formato MM:SS)
              const timeMatch = line.match(/^\d+:\d+/);
              if (timeMatch && i + 1 < lines.length) {
                transcription.push({
                  time: timeMatch[0],
                  text: lines[i + 1].trim()
                });
                i++; // Pular a próxima linha que já foi usada
              } else {
                transcription.push({ text: line });
              }
            }
          }
        }
      }
      
      return transcription;
    } catch (error) {
      console.error('Erro ao extrair transcrição:', error);
      throw new Error('Não foi possível obter a transcrição do vídeo. Verifique se o vídeo possui transcrição disponível.');
    }
  }
}

// Singleton para o serviço Zyte
let zyteService: ZyteService | null = null;

export function getZyteService(): ZyteService {
  if (!zyteService) {
    const apiKey = process.env.ZYTE_API_KEY;
    
    if (!apiKey) {
      throw new Error('A chave de API do Zyte não foi configurada. Configure a variável de ambiente ZYTE_API_KEY.');
    }
    
    zyteService = new ZyteService(apiKey);
  }
  
  return zyteService;
}