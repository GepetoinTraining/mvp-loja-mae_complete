// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/app/(protected)/marketing/engagement/page.tsx
import EngagementDashboardClient from "@/components/meta/EngagementDashboardClient";
import { Suspense } from "react";

export default function EngagementDashboardPage() {
  // TODO: Add role-based access control to ensure only MARKETER and ADMIN can access this page

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Social Media Engagement</h1>
      <p className="mb-6 text-gray-600">
        Review engagement on your published posts and identify potential leads.
      </p>
      <Suspense fallback={<div>Loading engagement dashboard...</div>}>
        <EngagementDashboardClient />
      </Suspense>
    </div>
  );
}

