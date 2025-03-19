"use client";
import { useState } from "react";
import { useAction } from "convex/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useSubscription } from "@/hooks/use-subscription";
import { useRouter } from "next/navigation";

const SubscriptionPage = () => {
  const { isLoading: isLoadingSubscription, isSubscribed } = useSubscription();

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const createStripeSession = useAction(api.stripe.createCheckoutSession);
  const priceMonthlyId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
  const priceYearlyId = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;

  const features = [
    "Extra UI customization",
    "Extra flexibility in file sending",
  ];
  if (isLoadingSubscription) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isSubscribed) {
    router.replace("/billing");
    return null;
  }

  const handleSubscribe = async (priceId: string) => {
    setIsLoading(true);
    try {
      const url = await createStripeSession({
        priceId,
        baseUrl: process.env.NEXT_PUBLIC_URL!,
      });
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Failed to create subscription session");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to start subscription process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Upgrade to Slackzz Pro</h1>
          <p className="mt-4 text-gray-600">
            Get access to premium features and take your communication to the
            next level
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <Card className="relative">
            <CardHeader>
              <CardTitle>Monthly</CardTitle>
              <CardDescription>
                Perfect for short-term experience
              </CardDescription>
              <div className="text-3xl font-bold mt-4">
                $1<span className="text-lg font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(priceMonthlyId!)}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Subscribe Monthly"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="relative border-blue-500">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
              BEST VALUE
            </div>
            <CardHeader>
              <CardTitle>Yearly</CardTitle>
              <CardDescription>Save +15% with annual billing</CardDescription>
              <div className="text-3xl font-bold mt-4">
                $10<span className="text-lg font-normal">/year</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => handleSubscribe(priceYearlyId!)}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Subscribe Yearly"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
