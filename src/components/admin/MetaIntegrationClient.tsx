// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/components/admin/MetaIntegrationClient.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MetaIntegrationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      setMessage({ type: "success", text: "Meta account connected successfully! You can now proceed to manage your posts." });
    } else if (error) {
      let errorMessage = "Failed to connect Meta account.";
      if (error === "oauth_failed") {
        errorMessage = "OAuth authentication failed. Please try again.";
      } else if (error === "config_missing") {
        errorMessage = "Server configuration for Meta integration is missing. Please contact support.";
      } else if (error === "token_exchange_failed") {
        errorMessage = "Failed to exchange authorization code for an access token with Meta.";
      } else if (error.startsWith("access_denied")) {
        errorMessage = "Access denied. You need to grant the required permissions in the Meta authorization screen.";
      } else if (error === "internal_server_error") {
        errorMessage = "An unexpected server error occurred. Please try again later.";
      }
      setMessage({ type: "error", text: errorMessage });
    }
    // Clean up URL by removing query params after displaying message
    if (success || error) {
      router.replace("/admin/meta-integration");
    }
  }, [searchParams, router]);

  const handleConnectMeta = () => {
    setIsLoading(true);
    // Redirect to our backend endpoint that initiates the OAuth flow
    router.push("/api/meta/auth");
  };

  // Placeholder for checking connection status (to be implemented when token storage is done)
  const isConnected = false; // This would be derived from user data / session

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {isConnected ? (
        <div>
          <p className="text-green-600 font-semibold">Meta Account Connected!</p>
          {/* TODO: Display connected account info and offer disconnect option */}
        </div>
      ) : (
        <div>
          <p className="mb-4 text-gray-700">
            Click the button below to connect your Facebook and Instagram accounts.
            You will be redirected to Meta to authorize the connection.
          </p>
          <Button onClick={handleConnectMeta} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? "Connecting..." : "Connect Meta Account"}
          </Button>
        </div>
      )}
       <div className="mt-6 text-xs text-gray-500">
        <p>By connecting your account, you allow this application to:</p>
        <ul className="list-disc list-inside ml-4 mt-1">
            <li>View your Facebook Pages and Instagram Professional accounts.</li>
            <li>Publish posts (text, images, videos) on your behalf.</li>
            <li>Read engagement data (likes, comments) on your posts.</li>
            <li>Access basic insights for your posts and accounts.</li>
        </ul>
        <p className="mt-2">We will request the necessary permissions during the Meta authorization process.</p>
      </div>
    </div>
  );
}

