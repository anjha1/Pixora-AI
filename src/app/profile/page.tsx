import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProfilePage() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium">Plan:</span>
              <Badge variant={user.plan === "Pro" ? "default" : "secondary"}>
                {user.plan}
              </Badge>
            </div>

            {user.renewalDate && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Renews:</span>
                <span>{user.renewalDate.toLocaleDateString()}</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <span className="font-medium">Usage:</span>
              <span>{user.usageCount} / {user.usageLimit === 999999 ? "Unlimited" : user.usageLimit}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-2">
                <p><strong>Status:</strong> {subscription.status}</p>
                {subscription.currentPeriodEnd && (
                  <p><strong>Current Period End:</strong> {subscription.currentPeriodEnd.toLocaleDateString()}</p>
                )}
              </div>
            ) : (
              <p>No active subscription</p>
            )}
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button asChild>
            <Link href="/billing">Manage Billing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to App</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}