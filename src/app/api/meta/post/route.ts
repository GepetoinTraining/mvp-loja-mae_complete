// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/app/api/meta/post/route.ts
import { NextRequest, NextResponse } from "next/server";

interface MetaCredentials {
  fbPageAccessToken?: string;
  fbPageId?: string;
  igUserId?: string;
}

interface FbPostData {
  access_token: string;
  message: string;
  link?: string;
  // Other FB post fields as needed
}

interface IgContainerData {
  access_token: string;
  caption: string;
  image_url?: string;
  media_type?: "VIDEO";
  video_url?: string;
  // Other IG container fields
}

interface PostResultDetail {
    platform: "Facebook" | "Instagram";
    success: boolean;
    id?: string;
    error?: string;
}

// Interfaces for Meta API responses
interface MetaError {
    message: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
}

interface MetaPostResponse {
    id?: string;
    error?: MetaError;
}

interface MetaIgContainerResponse {
    id?: string; // This is the creation_id
    error?: MetaError;
}

interface MetaIgPublishResponse {
    id?: string; // This is the media_id
    error?: MetaError;
}

async function getMetaCredentials(userId: string): Promise<MetaCredentials> {
  console.warn(`[Meta Post API] DB lookup for Meta credentials for user ${userId} is deferred. Using placeholders if available.`)
  return {
    fbPageAccessToken: process.env.PLACEHOLDER_FB_PAGE_ACCESS_TOKEN,
    fbPageId: process.env.PLACEHOLDER_FB_PAGE_ID,                  
    igUserId: process.env.PLACEHOLDER_IG_USER_ID,                  
  };
}

export async function POST(request: NextRequest) {
  const userId = "placeholder_user_id"; 

  const { fbPageAccessToken, fbPageId, igUserId } = await getMetaCredentials(userId);

  const body = await request.json();
  const { message, imageUrl, videoUrl, linkUrl, publishToFacebook, publishToInstagram } = body as {
    message: string;
    imageUrl?: string;
    videoUrl?: string;
    linkUrl?: string;
    publishToFacebook: boolean;
    publishToInstagram: boolean;
  };

  const results: PostResultDetail[] = [];

  if (publishToFacebook && fbPageId && fbPageAccessToken) {
    try {
      const fbApiUrl = `https://graph.facebook.com/v19.0/${fbPageId}/feed`;
      const fbPostData: FbPostData = { access_token: fbPageAccessToken, message };

      if (linkUrl) {
        fbPostData.link = linkUrl;
      } else if (imageUrl) {
        if(!linkUrl) fbPostData.link = imageUrl; 
      } else if (videoUrl) {
        if(!linkUrl) fbPostData.link = videoUrl;
      }

      const fbResponse = await fetch(fbApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fbPostData),
      });
      const fbResult = await fbResponse.json() as MetaPostResponse;
      if (fbResponse.ok && fbResult.id) {
        results.push({ platform: "Facebook", success: true, id: fbResult.id });
      } else {
        results.push({ platform: "Facebook", success: false, error: fbResult.error?.message || "Failed to post to Facebook" });
        console.error("Facebook API Error:", fbResult.error);
      }
    } catch (e) {
      console.error("Exception posting to Facebook:", e);
      results.push({ platform: "Facebook", success: false, error: (e as Error).message });
    }
  }

  if (publishToInstagram && igUserId && fbPageAccessToken) {
    try {
      const igMediaContainerUrl = `https://graph.facebook.com/v19.0/${igUserId}/media`;
      const igContainerData: IgContainerData = { access_token: fbPageAccessToken, caption: message };

      if (imageUrl) {
        igContainerData.image_url = imageUrl;
      } else if (videoUrl) {
        igContainerData.media_type = "VIDEO";
        igContainerData.video_url = videoUrl;
      } else {
        results.push({ platform: "Instagram", success: false, error: "Instagram posts require an image or video." });
      }

      if (igContainerData.image_url || igContainerData.video_url) {
        const containerResponse = await fetch(igMediaContainerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(igContainerData),
        });
        const containerResult = await containerResponse.json() as MetaIgContainerResponse;

        if (containerResponse.ok && containerResult.id) {
          const creationId = containerResult.id;
          const igPublishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
          const publishData = { access_token: fbPageAccessToken, creation_id: creationId };

          const publishResponse = await fetch(igPublishUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(publishData),
          });
          const publishResult = await publishResponse.json() as MetaIgPublishResponse;

          if (publishResponse.ok && publishResult.id) {
            results.push({ platform: "Instagram", success: true, id: publishResult.id });
          } else {
            results.push({ platform: "Instagram", success: false, error: publishResult.error?.message || "Failed to publish to Instagram" });
            console.error("Instagram Publish API Error:", publishResult.error);
          }
        } else {
          results.push({ platform: "Instagram", success: false, error: containerResult.error?.message || "Failed to create Instagram media container" });
          console.error("Instagram Container API Error:", containerResult.error);
        }
      }
    } catch (e) {
      console.error("Exception posting to Instagram:", e);
      results.push({ platform: "Instagram", success: false, error: (e as Error).message });
    }
  }

  if (results.length === 0) {
    return NextResponse.json({ error: "No platforms selected or configured for posting." }, { status: 400 });
  }

  const overallSuccess = results.every(r => r.success);
  return NextResponse.json(
    {
      message: overallSuccess ? "Post(s) submitted successfully." : "Some posts may have failed. Check details.",
      details: results,
    },
    { status: overallSuccess ? 200 : 207 } 
  );
}

