import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { 
  generateContentSchema, 
  registerUserSchema, 
  loginUserSchema 
} from "@shared/schema";
import { generateLearningPlan, generateFlashcards, generateQuiz } from "./services/openai";
import { storage } from "./storage";
import { getSession, requireAuth, optionalAuth, validatePassword } from "./auth";
import { ZodError } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(getSession());

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Ein Account mit dieser E-Mail existiert bereits" });
      }

      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Dieser Benutzername ist bereits vergeben" });
      }

      const user = await storage.createUser(userData);
      (req.session as any).userId = user.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username, 
          isPremium: user.isPremium 
        } 
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registrierung fehlgeschlagen" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !(await validatePassword(password, user.password))) {
        return res.status(400).json({ message: "Ungültige E-Mail oder Passwort" });
      }

      (req.session as any).userId = user.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username, 
          isPremium: user.isPremium 
        } 
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Anmeldung fehlgeschlagen" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Erfolgreich abgemeldet" });
    });
  });

  app.get("/api/me", requireAuth, (req: any, res) => {
    const user = req.user;
    res.json({ 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      isPremium: user.isPremium,
      dailyGenerationsUsed: user.dailyGenerationsUsed || 0,
      lastGenerationDate: user.lastGenerationDate
    });
  });

  // Generate content endpoint with auth and limits
  app.post("/api/generate-content", requireAuth, async (req: any, res) => {
    try {
      const { topic } = generateContentSchema.parse(req.body);
      const userId = req.user.id;
      
      // Check if user can generate content
      const canGenerate = await storage.canUserGenerateContent(userId);
      if (!canGenerate.allowed) {
        return res.status(403).json({ message: canGenerate.reason });
      }
      
      // Generate all content in parallel for faster response
      const [plan, flashcards, quiz] = await Promise.all([
        generateLearningPlan(topic),
        generateFlashcards(topic),
        generateQuiz(topic)
      ]);

      // Store the generated content
      const learningPlan = await storage.createLearningPlan({
        userId,
        topic,
        plan,
        flashcards,
        quiz
      });

      // Increment user's daily generation count
      await storage.incrementUserGenerations(userId);

      res.json({
        id: learningPlan.id,
        topic: learningPlan.topic,
        plan: learningPlan.plan,
        flashcards: learningPlan.flashcards,
        quiz: learningPlan.quiz
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error generating content:", error);
      res.status(500).json({ 
        message: error.message || "Fehler beim Generieren des Inhalts" 
      });
    }
  });

  // Get learning plan endpoint
  app.get("/api/learning-plan/:id", optionalAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const learningPlan = await storage.getLearningPlan(id);
      
      if (!learningPlan) {
        return res.status(404).json({ message: "Lernplan nicht gefunden" });
      }

      // If plan has a user, check if current user can access it
      if (learningPlan.userId && (!req.user || req.user.id !== learningPlan.userId)) {
        return res.status(403).json({ message: "Zugriff verweigert" });
      }

      res.json(learningPlan);
    } catch (error: any) {
      console.error("Error fetching learning plan:", error);
      res.status(500).json({ 
        message: "Fehler beim Laden des Lernplans" 
      });
    }
  });

  // Get user's learning plans
  app.get("/api/my-plans", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const plans = await storage.getUserLearningPlans(userId);
      
      res.json(plans.map(plan => ({
        id: plan.id,
        topic: plan.topic,
        createdAt: plan.createdAt,
      })));
    } catch (error: any) {
      console.error("Error fetching user plans:", error);
      res.status(500).json({ 
        message: "Fehler beim Laden der Lernpläne" 
      });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", requireAuth, async (req: any, res) => {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 999, // €9.99 in cents
        currency: "eur",
        metadata: {
          userId: req.user.id,
          type: "premium_upgrade"
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret 
      });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ 
        message: "Fehler bei der Zahlungsabwicklung" 
      });
    }
  });

  // Webhook to handle successful payments
  app.post("/webhook/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('Missing stripe signature');
    }
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        const userId = paymentIntent.metadata.userId;
        
        if (userId && paymentIntent.metadata.type === 'premium_upgrade') {
          await storage.updateUserPremiumStatus(userId, true);
          console.log(`User ${userId} upgraded to premium`);
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}