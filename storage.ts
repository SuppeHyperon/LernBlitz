import {
  users,
  learningPlans,
  type User,
  type RegisterUser,
  type LearningPlan,
  type InsertLearningPlan,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  updateUserPremiumStatus(id: string, isPremium: boolean): Promise<User>;
  updateUserStripeInfo(id: string, customerId?: string, subscriptionId?: string): Promise<User>;
  canUserGenerateContent(id: string): Promise<{ allowed: boolean; reason?: string }>;
  incrementUserGenerations(id: string): Promise<void>;
  
  // Learning plan operations
  getLearningPlan(id: string): Promise<LearningPlan | undefined>;
  createLearningPlan(plan: InsertLearningPlan): Promise<LearningPlan>;
  getUserLearningPlans(userId: string): Promise<LearningPlan[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: RegisterUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUserPremiumStatus(id: string, isPremium: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isPremium,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, customerId?: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async canUserGenerateContent(id: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = await this.getUser(id);
    if (!user) {
      return { allowed: false, reason: "User not found" };
    }

    // Premium users have unlimited access
    if (user.isPremium) {
      return { allowed: true };
    }

    // Check daily limit for free users
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastGenDate = user.lastGenerationDate ? new Date(user.lastGenerationDate) : null;
    const isSameDay = lastGenDate && lastGenDate.getTime() >= today.getTime();
    
    if (isSameDay && (user.dailyGenerationsUsed || 0) >= 1) {
      return { 
        allowed: false, 
        reason: "Tageslimit erreicht. Upgrade auf Premium für unbegrenzte Lernpläne." 
      };
    }

    return { allowed: true };
  }

  async incrementUserGenerations(id: string): Promise<void> {
    const user = await this.getUser(id);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastGenDate = user.lastGenerationDate ? new Date(user.lastGenerationDate) : null;
    const isSameDay = lastGenDate && lastGenDate.getTime() >= today.getTime();
    
    const newCount = isSameDay ? (user.dailyGenerationsUsed || 0) + 1 : 1;
    
    await db
      .update(users)
      .set({ 
        dailyGenerationsUsed: newCount,
        lastGenerationDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async getLearningPlan(id: string): Promise<LearningPlan | undefined> {
    const [plan] = await db.select().from(learningPlans).where(eq(learningPlans.id, id));
    return plan || undefined;
  }

  async createLearningPlan(planData: InsertLearningPlan): Promise<LearningPlan> {
    const [plan] = await db
      .insert(learningPlans)
      .values(planData)
      .returning();
    return plan;
  }

  async getUserLearningPlans(userId: string): Promise<LearningPlan[]> {
    return await db
      .select()
      .from(learningPlans)
      .where(eq(learningPlans.userId, userId))
      .orderBy(desc(learningPlans.createdAt));
  }
}

export const storage = new DatabaseStorage();