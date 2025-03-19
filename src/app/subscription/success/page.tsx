"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";

const SubscriptionSuccess = () => {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const verifySubscription = useAction(api.stripe.verifySubscription);
  useEffect(() => {
    let isMounted = true;
    const hasVerified = sessionStorage.getItem("subscription_verified");
    if (hasVerified) {
      setIsVerifying(false);
      setIsVerified(true);
      return;
    }

    const verifySession = async () => {
      const sessionId = new URLSearchParams(window.location.search).get(
        "session_id"
      );

      if (!sessionId) {
        if (isMounted) {
          toast.error("Invalid session");
          router.push("/subscription");
        }

        return;
      }

      try {
        await verifySubscription({ sessionId });
        if (isMounted) {
          sessionStorage.setItem("subscription_verified", "true");
          setIsVerified(true);
          toast.success("Subscription activated successfully!");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Verification error:", error);
          toast.error("Failed to verify subscription. Please contact support.");
          router.push("/subscription");
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Redirect if no session_id is present
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(
      "session_id"
    );

    if (!sessionId && !isVerifying && !isVerified) {
      router.push("/subscription");
    }
  }, [isVerifying, isVerified, router]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p>Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Thank you for subscribing!</CardTitle>
          <CardDescription>
            Your subscription has been successfully activated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            You now have access to all Pro features. Start exploring them now!
          </p>
          <Button
            className="w-full"
            onClick={() => {
              // Clean up verification state before redirecting
              sessionStorage.removeItem("subscription_verified");
              router.push("/");
            }}
          >
            Return
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
