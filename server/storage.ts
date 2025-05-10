import {
  users, youtubeVideos, youtubeChannels,
  type User, type InsertUser,
  type YoutubeVideo, type InsertYoutubeVideo,
  type YoutubeChannel, type InsertYoutubeChannel
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<Omit<User, "id" | "createdAt">>): Promise<User | undefined>;
  
  // YouTube video methods
  getYoutubeVideo(id: string): Promise<YoutubeVideo | undefined>;
  getYoutubeVideosByUser(userId: string): Promise<YoutubeVideo[]>;
  saveYoutubeVideo(video: InsertYoutubeVideo): Promise<YoutubeVideo>;
  deleteYoutubeVideo(id: string, userId: string): Promise<void>;
  
  // YouTube channel methods
  getYoutubeChannel(id: string): Promise<YoutubeChannel | undefined>;
  getYoutubeChannelsByUser(userId: string): Promise<YoutubeChannel[]>;
  saveYoutubeChannel(channel: InsertYoutubeChannel): Promise<YoutubeChannel>;
  deleteYoutubeChannel(id: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<Omit<User, "id" | "createdAt">>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  // YouTube video methods
  async getYoutubeVideo(id: string): Promise<YoutubeVideo | undefined> {
    const [video] = await db.select().from(youtubeVideos).where(eq(youtubeVideos.id, id));
    return video;
  }
  
  async getYoutubeVideosByUser(userId: string): Promise<YoutubeVideo[]> {
    return db
      .select()
      .from(youtubeVideos)
      .where(eq(youtubeVideos.userId, userId))
      .orderBy(desc(youtubeVideos.savedAt));
  }
  
  async saveYoutubeVideo(video: InsertYoutubeVideo): Promise<YoutubeVideo> {
    // Verifica se o vídeo já existe para este usuário
    const existingVideo = await this.getYoutubeVideo(video.id);
    
    if (existingVideo) {
      // Atualiza vídeo existente
      const [updatedVideo] = await db
        .update(youtubeVideos)
        .set(video)
        .where(eq(youtubeVideos.id, video.id))
        .returning();
      
      return updatedVideo;
    } else {
      // Insere novo vídeo
      const [newVideo] = await db
        .insert(youtubeVideos)
        .values(video)
        .returning();
      
      return newVideo;
    }
  }
  
  async deleteYoutubeVideo(id: string, userId: string): Promise<void> {
    await db
      .delete(youtubeVideos)
      .where(
        and(
          eq(youtubeVideos.id, id),
          eq(youtubeVideos.userId, userId)
        )
      );
  }
  
  // YouTube channel methods
  async getYoutubeChannel(id: string): Promise<YoutubeChannel | undefined> {
    const [channel] = await db
      .select()
      .from(youtubeChannels)
      .where(eq(youtubeChannels.id, id));
    
    return channel;
  }
  
  async getYoutubeChannelsByUser(userId: string): Promise<YoutubeChannel[]> {
    return db
      .select()
      .from(youtubeChannels)
      .where(eq(youtubeChannels.userId, userId))
      .orderBy(desc(youtubeChannels.savedAt));
  }
  
  async saveYoutubeChannel(channel: InsertYoutubeChannel): Promise<YoutubeChannel> {
    // Verifica se o canal já existe para este usuário
    const existingChannel = await this.getYoutubeChannel(channel.id);
    
    if (existingChannel) {
      // Atualiza canal existente
      const [updatedChannel] = await db
        .update(youtubeChannels)
        .set(channel)
        .where(eq(youtubeChannels.id, channel.id))
        .returning();
      
      return updatedChannel;
    } else {
      // Insere novo canal
      const [newChannel] = await db
        .insert(youtubeChannels)
        .values(channel)
        .returning();
      
      return newChannel;
    }
  }
  
  async deleteYoutubeChannel(id: string, userId: string): Promise<void> {
    await db
      .delete(youtubeChannels)
      .where(
        and(
          eq(youtubeChannels.id, id),
          eq(youtubeChannels.userId, userId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
