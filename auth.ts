import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import type { RequestHandler } from "express";
import { storage } from "./storage";

const pgStore = connectPg(session);

export function getSession() {
  return session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET || "your-session-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  });
}

export const requireAuth: RequestHandler = async (req: any, res, next) => {
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = user;
  next();
};

export const optionalAuth: RequestHandler = async (req: any, res, next) => {
  const userId = req.session?.userId;
  
  if (userId) {
    const user = await storage.getUser(userId);
    if (user) {
      req.user = user;
    }
  }
  
  next();
};

export async function validatePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}