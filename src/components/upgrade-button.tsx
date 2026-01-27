"use client";

import { Button } from "@/components/ui/button";

export default function UpgradeButton() {
  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url; // Redirect to Stripe Checkout
      } else {
        console.error("Failed to create checkout session");
        // Optionally, show an error message to the user
      }
    } catch (error) {
      console.error("Error:", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <Button onClick={handleUpgrade}>
      Upgrade to Pro
    </Button>
  );
}