// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/components/marketing/PostCreatorClient.tsx
"use client";

import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { useForm, SubmitHandler } from "react-hook-form";
import { useState } from "react";

interface PostFormData {
  message: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  publishToFacebook: boolean;
  publishToInstagram: boolean;
}

export default function PostCreatorClient() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PostFormData>({
    defaultValues: {
      publishToFacebook: true,
      publishToInstagram: true,
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [postResult, setPostResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const publishToFacebook = watch("publishToFacebook");
  const publishToInstagram = watch("publishToInstagram");

  const onSubmit: SubmitHandler<PostFormData> = async (data) => {
    setIsLoading(true);
    setPostResult(null);

    if (!data.publishToFacebook && !data.publishToInstagram) {
      setPostResult({ type: "error", text: "Please select at least one platform (Facebook or Instagram) to publish to." });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/meta/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setPostResult({ type: "success", text: result.message || "Post submitted successfully! Check individual platform status for details." });
      } else {
        setPostResult({ type: "error", text: result.error || "Failed to submit post. Please try again." });
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      setPostResult({ type: "error", text: "An unexpected error occurred while submitting the post." });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 shadow-lg rounded-lg">
      {postResult && (
        <div className={`p-3 rounded-md text-sm ${postResult.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {postResult.text}
        </div>
      )}

      <div>
        <Label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Post Content / Caption</Label>
        <Textarea
          id="message"
          {...register("message", { required: "Post content is required." })}
          rows={5}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="What's on your mind?" // Escaped apostrophe
        />
        {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
      </div>

      <div>
        <Label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          type="url"
          {...register("imageUrl")}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-gray-500 mt-1">Provide a direct public URL to an image (JPEG for Instagram).</p>
      </div>

      <div>
        <Label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">Video URL (Optional)</Label>
        <Input
          id="videoUrl"
          type="url"
          {...register("videoUrl")}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/video.mp4"
        />
        <p className="text-xs text-gray-500 mt-1">Provide a direct public URL to a video.</p>
      </div>

      <div>
        <Label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 mb-1">Link URL (Optional - for Facebook link posts)</Label>
        <Input
          id="linkUrl"
          type="url"
          {...register("linkUrl")}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/article"
        />
      </div>

      <div className="space-y-2">
        <Label className="block text-sm font-medium text-gray-700">Publish to:</Label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Checkbox id="publishToFacebook" {...register("publishToFacebook")} defaultChecked className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" aria-label="Publish to Facebook"/>
            <Label htmlFor="publishToFacebook" className="ml-2 text-sm text-gray-700">Facebook Page</Label>
          </div>
          <div className="flex items-center">
            <Checkbox id="publishToInstagram" {...register("publishToInstagram")} defaultChecked className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500" aria-label="Publish to Instagram"/>
            <Label htmlFor="publishToInstagram" className="ml-2 text-sm text-gray-700">Instagram Professional Account</Label>
          </div>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={isLoading || (!publishToFacebook && !publishToInstagram)} className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
          {isLoading ? "Submitting Post..." : "Publish Post"}
        </Button>
      </div>
    </form>
  );
}

