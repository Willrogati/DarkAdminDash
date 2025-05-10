import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(), // Usa o UID do Firebase como ID
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).unique().notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const youtubeVideos = pgTable("youtube_videos", {
  id: varchar("id", { length: 50 }).primaryKey(), // ID do vídeo no YouTube
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  channelId: varchar("channel_id", { length: 50 }).notNull(),
  channelTitle: varchar("channel_title", { length: 100 }),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count"),
  likeCount: integer("like_count"),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
  userId: varchar("user_id", { length: 128 }).notNull(),
});

export const youtubeChannels = pgTable("youtube_channels", {
  id: varchar("id", { length: 50 }).primaryKey(), // ID do canal no YouTube
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  subscriberCount: integer("subscriber_count"),
  videoCount: integer("video_count"),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
  userId: varchar("user_id", { length: 128 }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  name: true,
  email: true,
  imageUrl: true,
});

export const insertYoutubeVideoSchema = createInsertSchema(youtubeVideos).omit({
  savedAt: true,
});

export const insertYoutubeChannelSchema = createInsertSchema(youtubeChannels).omit({
  savedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertYoutubeVideo = z.infer<typeof insertYoutubeVideoSchema>;
export type YoutubeVideo = typeof youtubeVideos.$inferSelect;

export type InsertYoutubeChannel = z.infer<typeof insertYoutubeChannelSchema>;
export type YoutubeChannel = typeof youtubeChannels.$inferSelect;
