import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}?payment=success`,
        },
      });

      if (error) {
        toast({
          title: "Zahlung fehlgeschlagen",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Premium für 9,99€ freischalten
      </Button>
    </form>
  );
}

export default function PremiumPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const { mutate: createPaymentIntent, isPending } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/create-payment-intent");
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Zahlung konnte nicht initialisiert werden.",
        variant: "destructive",
      });
    }
  });

  if (user?.isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Du bist bereits Premium!</CardTitle>
            <CardDescription className="text-lg">
              Genieße unbegrenzte Lernpläne und alle Premium-Features.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/'} size="lg">
              Zurück zur App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Upgrade auf Premium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Schalte unbegrenzte Lernpläne frei und lerne ohne Limits
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Kostenlos
                <Badge variant="secondary">Aktuell</Badge>
              </CardTitle>
              <CardDescription>Perfekt zum Ausprobieren</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">0€</div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  1 Lernplan pro Tag
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Grundlegende Funktionen
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Quiz & Karteikarten
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border-purple-200 dark:border-purple-800 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Crown className="w-3 h-3 mr-1" />
                Beliebt
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Premium
                <Zap className="w-5 h-5 text-yellow-500" />
              </CardTitle>
              <CardDescription>Für ernsthafte Lerner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">9,99€ <span className="text-sm font-normal text-gray-500">einmalig</span></div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  <strong>Unbegrenzte Lernpläne</strong>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Alle kostenlosen Features
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Prioritätssupport
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Speichere alle Lernpläne
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Premium freischalten</CardTitle>
            <CardDescription>
              Sichere Zahlung mit Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!clientSecret ? (
              <Button 
                onClick={() => createPaymentIntent()} 
                disabled={isPending}
                className="w-full"
                size="lg"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Jetzt upgraden
              </Button>
            ) : (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                  }
                }}
              >
                <CheckoutForm />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
