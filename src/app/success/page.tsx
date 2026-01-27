import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/");
  }

  // Verify the checkout session with Stripe
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("Error retrieving Stripe session:", error);
    redirect("/");
  }

  // Check if payment was successful
  if (stripeSession.payment_status !== "paid") {
    redirect("/");
  }

  // Get user data from database
  let user = await prisma.users.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/");
  }

  // If user is still Free, update immediately for immediate feedback
  // The webhook will handle the final update with subscription details
  if (user.plan !== "Pro") {
    // Calculate renewal date (1 month from now)
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    user = await prisma.users.update({
      where: { id: user.id },
      data: {
        plan: "Pro",
        usageLimit: 999999, // Unlimited
        renewalDate: renewalDate,
        stripeCustomerId: stripeSession.customer as string,
      },
    });
  }

  const isUpgraded = user.plan === "Pro";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isUpgraded ? "🎉 Payment Successful!" : "⏳ Processing Payment..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {isUpgraded ? (
              <>
                <p className="text-lg">
                  Welcome to Pixora AI Pro! Your account has been upgraded successfully.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="font-medium">Plan:</span>
                    <Badge variant="default">Pro</Badge>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="font-medium">Usage:</span>
                    <span>Unlimited</span>
                  </div>
                  {user.renewalDate && (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="font-medium">Renews:</span>
                      <span>{user.renewalDate.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Your Pro subscription is active for 1 month. You now have unlimited usage!
                </p>
              </>
            ) : (
              <>
                <p className="text-lg">
                  Your payment has been processed. We're updating your account...
                </p>
                <p className="text-sm text-muted-foreground">
                  If this takes longer than a few minutes, please contact support.
                </p>
              </>
            )}

            <div className="flex space-x-4 justify-center pt-4">
              <Button asChild>
                <Link href="/profile">View Profile</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Start Using Pixora AI</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}