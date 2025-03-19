"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Loader } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAction, useQuery } from "convex/react";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { UseGetSubscriptionsRemainingTime } from "@/features/subscription/api/use-get-subscription-remaing-time";
import { api } from "../../../convex/_generated/api";
import { formatDate } from "@/lib/utils";

const STRIPE_YEARLY_PRICE = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!;

export default function BillingPage() {
  const router = useRouter();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core data fetching
  const { isLoading: isSubscriptionLoading, isSubscribed } = useSubscription();
  const { data: currentUser, isLoading: isLoadingCurrentUser } =
    useCurrentUser();
  const { data: remainingTime, isLoading: isLoadingRemainingTime } =
    UseGetSubscriptionsRemainingTime();

  const subscription = useQuery(
    api.stripe.getByUserId,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const isLoadingGetSubscription = subscription === undefined;

  const createStripePortal = useAction(api.stripe.createPortalLink);

  const isLoading =
    isSubscriptionLoading ||
    isLoadingRemainingTime ||
    isLoadingCurrentUser ||
    isLoadingGetSubscription;

  const handlePortalAccess = async () => {
    if (!subscription?.stripeCustomerId) {
      setError("No valid subscription found. Please contact support.");
      return;
    }

    try {
      setIsLoadingPortal(true);
      setError(null);

      const url = await createStripePortal({
        customerId: subscription.stripeCustomerId,
        returnUrl: window.location.href,
      });

      window.location.href = url;
    } catch (err) {
      setError("Failed to access billing portal. Please try again later.");
      console.error("Portal access error:", err);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentUser?._id) {
    router.replace("/");
    return null;
  }

  if (!isSubscribed || !remainingTime?.daysRemaining) {
    router.replace("/subscription");
    return null;
  }

  if (subscription === null) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Subscription Not Found</AlertTitle>
          <AlertDescription>
            Unable to find your subscription details. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const subscriptionType =
    subscription?.stripePriceId === STRIPE_YEARLY_PRICE ? "Yearly" : "Monthly";
  const nextBillingDate = subscription?.stripeCurrentPeriodEnd
    ? new Date(subscription.stripeCurrentPeriodEnd * 1000)
    : new Date();
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center">
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground text-center">
          Manage your subscription and billing information
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your subscription details and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan Type</p>
                <p className="font-medium">{subscriptionType} Plan</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium text-green-600">
                  {subscription?.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Next Billing Date
                </p>
                <p className="font-medium">{formatDate(nextBillingDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <p className="font-medium">
                  {remainingTime.daysRemaining} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manage Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>
              Update your payment method or change your subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handlePortalAccess}
              disabled={isLoadingPortal || !subscription?.stripeCustomerId}
              className="w-full"
            >
              {isLoadingPortal ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Manage Billing"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Contact our support team for any questions about your subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                (window.location.href = "mailto:support@yourdomain.com")
              }
            >
              Contact Support
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                router.replace("/");
              }}
              className="w-full"
            >
              Return
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
