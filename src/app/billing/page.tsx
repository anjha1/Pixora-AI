import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import UpgradeButton from "@/components/upgrade-button";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/");
  }

  const subscription = await prisma.subscriptions.findFirst({
    where: { userId: user.id },
  });

  // Mock payment history - in a real app, you'd fetch this from Stripe
  const paymentHistory: any[] = [
    // This would be populated from Stripe API
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Billing</h1>

        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Plan:</span>
                <Badge variant={user.plan === "Pro" ? "default" : "secondary"}>
                  {user.plan}
                </Badge>
              </div>
              {user.plan === "Free" && <UpgradeButton />}
            </div>

            {subscription && (
              <div className="space-y-2">
                <p><strong>Status:</strong> {subscription.status}</p>
                {subscription.currentPeriodEnd && (
                  <p><strong>Next billing date:</strong> {subscription.currentPeriodEnd.toLocaleDateString()}</p>
                )}
              </div>
            )}

            {user.stripeCustomerId && (
              <Button variant="outline" asChild>
                <a
                  href={`https://billing.stripe.com/p/login/${process.env.STRIPE_CUSTOMER_PORTAL_SECRET}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Manage Subscription
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentHistory.length > 0 ? (
              <div className="space-y-4">
                {paymentHistory.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{payment.amount}</p>
                      <Badge variant={payment.status === "paid" ? "default" : "destructive"}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No payment history available</p>
            )}
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button variant="outline" asChild>
            <Link href="/profile">Back to Profile</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to App</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}