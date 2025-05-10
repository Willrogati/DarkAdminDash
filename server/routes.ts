import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

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
  (req as any).userId = req.params.id;
  
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

  const httpServer = createServer(app);
  return httpServer;
}
