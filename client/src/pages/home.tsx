import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { 
  Zap, 
  Brain, 
  Share, 
  Smartphone, 
  GraduationCap, 
  Heart,
  Calendar,
  LayersIcon,
  HelpCircle,
  Copy,
  Download,
  CheckCircle,
  Crown,
  LogOut,
  User,
  Loader2
} from "lucide-react";
import type { LearningPlanContent, FlashcardContent, QuizContent } from "@shared/schema";

interface GeneratedContent {
  id: string;
  topic: string;
  plan: LearningPlanContent;
  flashcards: FlashcardContent;
  quiz: QuizContent;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [copiedContent, setCopiedContent] = useState<string | null>(null);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [showAllFlashcards, setShowAllFlashcards] = useState(false);
  const [showAllQuizQuestions, setShowAllQuizQuestions] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const generateContentMutation = useMutation({
    mutationFn: async (topic: string) => {
      return await apiRequest("POST", "/api/generate-content", { topic });
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      // Reset all interactive states
      setShowFullPlan(false);
      setShowAllFlashcards(false);
      setShowAllQuizQuestions(false);
      setSelectedAnswers({});
      setShowQuizResults(false);
      setFlippedCards(new Set());
      toast({
        title: "Lernplan erstellt!",
        description: "Dein personalisierter Lernplan ist bereit.",
      });
      // Scroll to generated content
      setTimeout(() => {
        document.getElementById('generated-content')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Beim Erstellen des Lernplans ist ein Fehler aufgetreten. Bitte versuche es erneut.",
        variant: "destructive",
      });
      console.error("Generation error:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: "Eingabe erforderlich",
        description: "Bitte gib ein Lernthema ein!",
        variant: "destructive",
      });
      return;
    }
    generateContentMutation.mutate(topic.trim());
  };

  const handleTopicClick = (selectedTopic: string) => {
    setTopic(selectedTopic);
  };

  const handleFlipCard = (cardId: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleSelectAnswer = (questionId: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleShowQuizResults = () => {
    setShowQuizResults(true);
  };

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedContent(type);
      toast({
        title: "Kopiert!",
        description: "Inhalt wurde in die Zwischenablage kopiert.",
      });
      setTimeout(() => setCopiedContent(null), 2000);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kopieren fehlgeschlagen. Bitte versuche es erneut.",
        variant: "destructive",
      });
    }
  };

  const formatPlanForCopy = (plan: LearningPlanContent) => {
    return plan.days.map(day => 
      `Tag ${day.day}: ${day.title}\n${day.description}\nAufgaben:\n${day.tasks.map(task => `- ${task}`).join('\n')}`
    ).join('\n\n');
  };

  const formatFlashcardsForCopy = (flashcards: FlashcardContent) => {
    return flashcards.cards.map(card => 
      `Frage: ${card.question}\nAntwort: ${card.answer}`
    ).join('\n\n');
  };

  const formatQuizForCopy = (quiz: QuizContent) => {
    return quiz.questions.map((q, idx) => 
      `${idx + 1}. ${q.question}\n${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}\nAntwort: ${String.fromCharCode(65 + q.correctAnswer)}) ${q.options[q.correctAnswer]}\nErklärung: ${q.explanation}`
    ).join('\n\n');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LernBlitz
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User info */}
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{user?.username}</span>
                {user?.isPremium ? (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                ) : (
                  <Badge variant="secondary">Kostenlos</Badge>
                )}
              </div>
              
              {/* Premium upgrade button */}
              {!user?.isPremium && (
                <Link href="/premium">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Crown className="w-4 h-4 mr-1" />
                    Premium
                  </Button>
                </Link>
              )}
              
              {/* Logout button */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Daily limit notice for free users */}
      {!user?.isPremium && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">
                  Kostenlos: {user?.dailyGenerationsUsed || 0}/1 Lernpläne heute genutzt
                </span>
              </div>
              <Link href="/premium">
                <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                  Unbegrenzt mit Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 sm:py-24">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200/20 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-green-200/20 rounded-full animate-pulse"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                KI erstellt dir
              </span>
              <br />
              deinen Lernplan in <span className="text-yellow-500">10 Sekunden</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Gib einfach dein Thema ein und erhalte sofort einen strukturierten Lernplan, 
              Karteikarten und Prüfungsfragen – perfekt für die TikTok-Generation.
            </p>
          </div>

          {/* Main Input Form */}
          <div className="animate-in slide-in-from-bottom-6 duration-1000 delay-300 max-w-2xl mx-auto">
            <Card className="shadow-xl border-gray-100">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative">
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-yellow-500 mr-2">💡</span>
                      Dein Lernthema
                    </label>
                    <Input
                      id="topic"
                      type="text"
                      placeholder="z.B. Weimarer Verfassung, Mitose, Bilanzierung nach HGB..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="text-lg py-4 border-2 focus:border-blue-500"
                      disabled={generateContentMutation.isPending}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold shadow-lg"
                    disabled={generateContentMutation.isPending}
                  >
                    {generateContentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Erstelle Lernplan...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Lernplan in 10 Sekunden erstellen
                      </>
                    )}
                  </Button>
                </form>

                {/* Example Topics */}
                <div className="mt-8">
                  <p className="text-sm text-gray-500 mb-4">Oder probiere eines dieser Beispiele:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["Photosynthese", "Französische Revolution", "Dreisatz", "JavaScript Basics", "Deutsche Grammatik"].map((exampleTopic) => (
                      <Button
                        key={exampleTopic}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTopicClick(exampleTopic)}
                        className="text-xs hover:bg-blue-50 hover:border-blue-200"
                        disabled={generateContentMutation.isPending}
                      >
                        {exampleTopic}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Generated Content Section */}
      {generatedContent && (
        <section id="generated-content" className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Dein Lernplan für: <span className="text-blue-600">{generatedContent.topic}</span>
              </h2>
              <div className="flex justify-center space-x-4">
                <Badge variant="secondary" className="text-green-600 bg-green-50">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  7-Tage Plan
                </Badge>
                <Badge variant="secondary" className="text-blue-600 bg-blue-50">
                  <Brain className="w-3 h-3 mr-1" />
                  {generatedContent.flashcards.cards.length} Karteikarten
                </Badge>
                <Badge variant="secondary" className="text-purple-600 bg-purple-50">
                  <HelpCircle className="w-3 h-3 mr-1" />
                  {generatedContent.quiz.questions.length} Quiz-Fragen
                </Badge>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Learning Plan */}
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-green-600" />
                    7-Tage Lernplan
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(formatPlanForCopy(generatedContent.plan), 'plan')}
                  >
                    {copiedContent === 'plan' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedContent.plan.days.slice(0, showFullPlan ? undefined : 3).map((day) => (
                    <div key={day.day} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Tag {day.day}</h4>
                        <Badge variant="outline" className="text-xs">
                          {day.tasks.length} Aufgaben
                        </Badge>
                      </div>
                      <h5 className="font-medium text-blue-600 mb-2">{day.title}</h5>
                      <p className="text-sm text-gray-600 mb-3">{day.description}</p>
                      <ul className="space-y-1">
                        {day.tasks.map((task, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  
                  {generatedContent.plan.days.length > 3 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowFullPlan(!showFullPlan)}
                      className="w-full"
                    >
                      {showFullPlan ? 'Weniger anzeigen' : `Alle ${generatedContent.plan.days.length} Tage anzeigen`}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Flashcards */}
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-blue-600" />
                    Karteikarten
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(formatFlashcardsForCopy(generatedContent.flashcards), 'flashcards')}
                  >
                    {copiedContent === 'flashcards' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedContent.flashcards.cards.slice(0, showAllFlashcards ? undefined : 5).map((card) => {
                    const isFlipped = flippedCards.has(card.id);
                    return (
                      <div
                        key={card.id}
                        className="border rounded-lg p-4 cursor-pointer hover:shadow-sm transition-all duration-200 min-h-[120px] flex items-center justify-center"
                        onClick={() => handleFlipCard(card.id)}
                      >
                        <div className="text-center">
                          {!isFlipped ? (
                            <>
                              <div className="text-sm text-gray-500 mb-2">Frage {card.id}</div>
                              <p className="text-gray-900 font-medium">{card.question}</p>
                              <div className="text-xs text-blue-600 mt-3">Klicken für Antwort</div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm text-green-600 mb-2">Antwort</div>
                              <p className="text-gray-900">{card.answer}</p>
                              <div className="text-xs text-gray-500 mt-3">Klicken für Frage</div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {generatedContent.flashcards.cards.length > 5 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAllFlashcards(!showAllFlashcards)}
                      className="w-full"
                    >
                      {showAllFlashcards ? 'Weniger anzeigen' : `Alle ${generatedContent.flashcards.cards.length} Karten anzeigen`}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Quiz */}
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5 text-purple-600" />
                    Quiz
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(formatQuizForCopy(generatedContent.quiz), 'quiz')}
                  >
                    {copiedContent === 'quiz' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {generatedContent.quiz.questions.slice(0, showAllQuizQuestions ? undefined : 3).map((question, qIndex) => (
                    <div key={qIndex} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {qIndex + 1}. {question.question}
                      </h4>
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => {
                          const isSelected = selectedAnswers[qIndex] === oIndex;
                          const isCorrect = oIndex === question.correctAnswer;
                          const showResults = showQuizResults;
                          
                          let buttonClass = "w-full text-left p-3 border rounded transition-colors ";
                          
                          if (showResults) {
                            if (isCorrect) {
                              buttonClass += "bg-green-50 border-green-200 text-green-800";
                            } else if (isSelected && !isCorrect) {
                              buttonClass += "bg-red-50 border-red-200 text-red-800";
                            } else {
                              buttonClass += "bg-gray-50 border-gray-200 text-gray-600";
                            }
                          } else {
                            if (isSelected) {
                              buttonClass += "bg-blue-50 border-blue-200 text-blue-800";
                            } else {
                              buttonClass += "hover:bg-gray-50 border-gray-200";
                            }
                          }
                          
                          return (
                            <button
                              key={oIndex}
                              className={buttonClass}
                              onClick={() => !showResults && handleSelectAnswer(qIndex, oIndex)}
                              disabled={showResults}
                            >
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + oIndex)})
                              </span>
                              {option}
                              {showResults && isCorrect && (
                                <CheckCircle className="inline ml-2 h-4 w-4 text-green-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      
                      {showResults && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>Erklärung:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {generatedContent.quiz.questions.length > 3 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAllQuizQuestions(!showAllQuizQuestions)}
                      className="w-full"
                    >
                      {showAllQuizQuestions ? 'Weniger anzeigen' : `Alle ${generatedContent.quiz.questions.length} Fragen anzeigen`}
                    </Button>
                  )}
                  
                  {!showQuizResults && Object.keys(selectedAnswers).length > 0 && (
                    <Button
                      onClick={handleShowQuizResults}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Ergebnisse anzeigen
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Warum LernBlitz?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Lernen war noch nie so einfach und effektiv
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Blitzschnell</h3>
              <p className="text-gray-600 text-sm">
                Dein kompletter Lernplan ist in nur 10 Sekunden fertig
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">KI-Power</h3>
              <p className="text-gray-600 text-sm">
                Fortschrittliche KI erstellt individuell auf dich zugeschnittene Inhalte
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <LayersIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Komplett</h3>
              <p className="text-gray-600 text-sm">
                Plan, Karteikarten und Quiz - alles in einem Tool
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile First</h3>
              <p className="text-gray-600 text-sm">
                Perfekt optimiert für dein Smartphone und Tablet
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
