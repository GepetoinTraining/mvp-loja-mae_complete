// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/app/(protected)/marketing/post-creator/page.tsx
import PostCreatorClient from "@/components/marketing/PostCreatorClient";
import { Suspense } from "react";

export default function PostCreatorPage() {
  // TODO: Add role-based access control to ensure only MARKETER and ADMIN can access this page
  // This would typically be handled in middleware or a higher-order component

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Social Media Post</h1>
      <p className="mb-6 text-gray-600">
        Compose your post for Facebook and Instagram. Ensure your Meta account is connected via the Admin settings.
      </p>
      <Suspense fallback={<div>Loading post creator...</div>}>
        <PostCreatorClient />
      </Suspense>
       <div className="mt-8 p-4 border border-blue-300 bg-blue-50 rounded-md">
        <h2 className="text-lg font-semibold text-blue-700">Posting Guidelines & Limitations</h2>
        <ul className="list-disc list-inside mt-2 text-blue-600 text-sm">
          <li>Ensure your media (images/videos) are accessible via a public URL for the API to fetch. Direct uploads will be supported later.</li>
          <li>Instagram supports JPEG for images. Videos have specific format requirements (check Meta docs).</li>
          <li>Reels and Carousels have specific structures. This initial version focuses on single image/video posts and text posts.</li>
          <li>There is a rate limit of 50 API-published posts per Instagram account in a 24-hour period.</li>
          <li>Facebook Page Publishing Authorization (PPA) might be required for some pages.</li>
        </ul>
      </div>
    </div>
  );
}

