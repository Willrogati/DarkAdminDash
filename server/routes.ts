import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertYoutubeVideoSchema, insertYoutubeChannelSchema } from "@shared/schema";
import { z } from "zod";
import { 
  getYouTubeService, 
  youtubeSearchSchema, 
  youtubeVideoDetailsSchema, 
  youtubeChannelDetailsSchema, 
  youtubeChannelVideosSchema 
} from "./youtube-service";

// Middleware para verificar token de autenticação
const authMiddleware = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // O token está no formato "Bearer <token>"
  const token = authHeader.split(' ')[1];
  
  // Poderíamos verificar o token aqui, mas já que estamos usando Firebase Auth,
  // a verificação é feita pelo cliente
  
  // Adicionamos o userId para uso nas rotas
  (req as any).userId = req.body.userId || req.query.userId || req.params.userId;
  
  next();
};

// Schema para atualização de usuário
const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Criar usuário
  app.post("/api/users", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: result.error.format() 
        });
      }
      
      // Verificar se o email já existe
      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(result.data);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Atualizar usuário
  app.patch("/api/users/:id", authMiddleware, async (req, res) => {
    try {
      // Verificar se o usuário existe
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validar dados de atualização
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: result.error.format() 
        });
      }
      
      // Se o email estiver sendo atualizado, verificar se já existe
      if (result.data.email && result.data.email !== user.email) {
        const existingUser = await storage.getUserByEmail(result.data.email);
        if (existingUser && existingUser.id !== req.params.id) {
          return res.status(409).json({ message: "Email already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(req.params.id, result.data);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // YouTube API routes
  
  // Pesquisar no YouTube
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const result = youtubeSearchSchema.safeParse({
        query: req.query.query,
        maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : undefined,
        type: req.query.type
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid search parameters", 
          errors: result.error.format() 
        });
      }
      
      try {
        const youtubeService = getYouTubeService();
        const searchResults = await youtubeService.search(
          result.data.query,
          result.data.maxResults,
          result.data.type
        );
        
        res.json(searchResults);
      } catch (error: any) {
        return res.status(500).json({ message: error.message || "Erro ao pesquisar no YouTube" });
      }
    } catch (error) {
      console.error("Error in YouTube search:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Obter detalhes de um vídeo
  app.get("/api/youtube/videos/:videoId", async (req, res) => {
    try {
      const result = youtubeVideoDetailsSchema.safeParse({
        videoId: req.params.videoId
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid video ID", 
          errors: result.error.format() 
        });
      }
      
      try {
        const youtubeService = getYouTubeService();
        const videoDetails = await youtubeService.getVideoDetails(result.data.videoId);
        
        res.json(videoDetails);
      } catch (error: any) {
        return res.status(404).json({ message: error.message || "Vídeo não encontrado" });
      }
    } catch (error) {
      console.error("Error fetching video details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Obter detalhes de um canal
  app.get("/api/youtube/channels/:channelId", async (req, res) => {
    try {
      const result = youtubeChannelDetailsSchema.safeParse({
        channelId: req.params.channelId
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid channel ID", 
          errors: result.error.format() 
        });
      }
      
      try {
        const youtubeService = getYouTubeService();
        const channelDetails = await youtubeService.getChannelDetails(result.data.channelId);
        
        res.json(channelDetails);
      } catch (error: any) {
        return res.status(404).json({ message: error.message || "Canal não encontrado" });
      }
    } catch (error) {
      console.error("Error fetching channel details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Obter vídeos de um canal
  app.get("/api/youtube/channels/:channelId/videos", async (req, res) => {
    try {
      const result = youtubeChannelVideosSchema.safeParse({
        channelId: req.params.channelId,
        maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : undefined
      });
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid request parameters", 
          errors: result.error.format() 
        });
      }
      
      try {
        const youtubeService = getYouTubeService();
        const videos = await youtubeService.getChannelVideos(
          result.data.channelId,
          result.data.maxResults
        );
        
        res.json(videos);
      } catch (error: any) {
        return res.status(404).json({ message: error.message || "Não foi possível obter os vídeos do canal" });
      }
    } catch (error) {
      console.error("Error fetching channel videos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Salvar vídeo favorito
  app.post("/api/youtube/videos/favorites", authMiddleware, async (req, res) => {
    try {
      const result = insertYoutubeVideoSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid video data", 
          errors: result.error.format() 
        });
      }
      
      const savedVideo = await storage.saveYoutubeVideo(result.data);
      res.status(201).json(savedVideo);
    } catch (error) {
      console.error("Error saving favorite video:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Obter vídeos favoritos do usuário
  app.get("/api/youtube/videos/favorites/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;
      const videos = await storage.getYoutubeVideosByUser(userId);
      
      res.json(videos);
    } catch (error) {
      console.error("Error fetching favorite videos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Excluir vídeo favorito
  app.delete("/api/youtube/videos/favorites/:videoId", authMiddleware, async (req, res) => {
    try {
      const videoId = req.params.videoId;
      const userId = (req as any).userId;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      await storage.deleteYoutubeVideo(videoId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting favorite video:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Salvar canal favorito
  app.post("/api/youtube/channels/favorites", authMiddleware, async (req, res) => {
    try {
      const result = insertYoutubeChannelSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid channel data", 
          errors: result.error.format() 
        });
      }
      
      const savedChannel = await storage.saveYoutubeChannel(result.data);
      res.status(201).json(savedChannel);
    } catch (error) {
      console.error("Error saving favorite channel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Obter canais favoritos do usuário
  app.get("/api/youtube/channels/favorites/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;
      const channels = await storage.getYoutubeChannelsByUser(userId);
      
      res.json(channels);
    } catch (error) {
      console.error("Error fetching favorite channels:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Excluir canal favorito
  app.delete("/api/youtube/channels/favorites/:channelId", authMiddleware, async (req, res) => {
    try {
      const channelId = req.params.channelId;
      const userId = (req as any).userId;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      await storage.deleteYoutubeChannel(channelId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting favorite channel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
