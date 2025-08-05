import OpenAI from "openai";
import type { LearningPlanContent, FlashcardContent, QuizContent } from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateLearningPlan(topic: string): Promise<LearningPlanContent> {
  // The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Du bist ein Lernexperte, der strukturierte 7-Tage-Lernpläne erstellt. Antworte nur mit gültigem JSON.",
      },
      {
        role: "user",
        content: `Erstelle einen detaillierten 7-Tage-Lernplan für das Thema "${topic}". Der Plan soll strukturiert und praktisch umsetzbar sein. Antworte nur mit JSON in diesem Format:
        {
          "days": [
            {
              "day": 1,
              "title": "Titel für Tag 1",
              "description": "Kurze Beschreibung der Tagesziele",
              "tasks": ["Aufgabe 1", "Aufgabe 2", "Aufgabe 3"]
            }
          ]
        }`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Failed to generate learning plan");
  }

  return JSON.parse(content);
}

export async function generateFlashcards(topic: string): Promise<FlashcardContent> {
  // The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Du bist ein Experte für Karteikarten. Erstelle prägnante und effektive Lernkarten. Antworte nur mit gültigem JSON.",
      },
      {
        role: "user",
        content: `Erstelle 10 Karteikarten für das Thema "${topic}". Jede Karte soll eine präzise Frage und eine vollständige Antwort haben. Antworte nur mit JSON in diesem Format:
        {
          "cards": [
            {
              "id": 1,
              "question": "Frage hier",
              "answer": "Detaillierte Antwort hier"
            }
          ]
        }`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Failed to generate flashcards");
  }

  return JSON.parse(content);
}

export async function generateQuiz(topic: string): Promise<QuizContent> {
  // The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Du bist ein Experte für Prüfungsfragen. Erstelle herausfordernde Multiple-Choice-Fragen mit Erklärungen. Antworte nur mit gültigem JSON.",
      },
      {
        role: "user",
        content: `Erstelle 8 Multiple-Choice-Fragen für das Thema "${topic}". Jede Frage soll 4 Antwortoptionen haben, eine korrekte Antwort und eine Erklärung. Antworte nur mit JSON in diesem Format:
        {
          "questions": [
            {
              "id": 1,
              "question": "Fragetext hier",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,
              "explanation": "Erklärung der korrekten Antwort"
            }
          ]
        }`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Failed to generate quiz");
  }

  return JSON.parse(content);
}
