// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/app/(protected)/admin/meta-integration/page.tsx
import MetaIntegrationClient from "@/components/admin/MetaIntegrationClient";
import { Suspense } from "react";

export default function MetaIntegrationPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Meta (Facebook & Instagram) Integration</h1>
      <p className="mb-4 text-gray-600">
        Connect your Meta account to enable publishing posts to your Facebook Pages and Instagram Professional accounts directly from this application.
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <MetaIntegrationClient />
      </Suspense>
      <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <h2 className="text-lg font-semibold text-yellow-700">Important Configuration Notice</h2>
        <p className="text-yellow-600 mt-2">
          For this integration to work, the following environment variables must be correctly set up in your application environment:
        </p>
        <ul className="list-disc list-inside mt-2 text-yellow-600">
          <li><code>META_APP_ID</code>: Your Meta Application ID.</li>
          <li><code>META_APP_SECRET</code>: Your Meta Application Secret.</li>
          <li><code>META_REDIRECT_URI</code>: The full redirect URI (e.g., <code>https://yourdomain.com/api/meta/auth/callback</code>) that you configured in your Meta App settings and matches the one used in the API routes.</li>
        </ul>
        <p className="text-yellow-600 mt-2">
          Please ensure these are configured before attempting to connect your Meta account.
        </p>
      </div>
    </div>
  );
}

