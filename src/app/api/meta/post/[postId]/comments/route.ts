// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/app/api/meta/post/[postId]/comments/route.ts
import { NextRequest, NextResponse } from "next/server"; // NextRequest for nextUrl

// Placeholder for fetching user-specific Meta access token
async function getMetaAccessToken(userId: string): Promise<string | undefined> {
  console.warn(`[Meta Comments API] DB lookup for Meta access token for user ${userId} is deferred.`);
  return process.env.PLACEHOLDER_FB_PAGE_ACCESS_TOKEN; // Or a general app access token if appropriate for comments
}

interface Comment {
    id: string;
    from?: { id: string; name: string }; // For Facebook
    username?: string; // For Instagram
    message: string; // Facebook uses "message", Instagram uses "text"
    created_time: string; // Facebook uses "created_time", Instagram uses "timestamp"
    like_count?: number;
    replies?: { data: MetaApiComment[] }; // For Instagram, if fetching replies
    comment_count?: number; // For Facebook
}

// Interface for the raw comment object from Meta API
interface MetaApiComment {
    id: string;
    from?: { id: string; name: string }; // Facebook
    username?: string; // Instagram
    message?: string; // Facebook
    text?: string; // Instagram
    created_time?: string; // Facebook
    timestamp?: string; // Instagram
    like_count?: number;
    replies?: { data: MetaApiComment[] }; // Instagram replies
    comment_count?: number; // Facebook
    // Add other potential fields if necessary
}

// Interface for the expected Meta API response structure (can include error or data)
interface MetaApiResponse {
    data?: MetaApiComment[];
    error?: {
        message: string;
        type?: string;
        code?: number;
        fbtrace_id?: string;
    };
    // Potentially other fields from Meta API
}

export async function GET(
  request: NextRequest // Using NextRequest to access nextUrl for pathname
): Promise<Response> { // Return type should be Promise<Response>
  const userId = "placeholder_user_id"; // Replace with actual user ID from session
  
  // Extract postId from the URL path
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/");
  const postId = segments.length === 6 ? segments[4] : undefined;

  if (!postId) {
    return NextResponse.json({ error: "Post ID could not be determined from URL" }, { status: 400 });
  }

  const accessToken = await getMetaAccessToken(userId);
  if (!accessToken) {
    console.warn("[Meta Comments API] Access token missing, returning mock data if enabled.");
  }

  const isInstagramPost = postId.startsWith("ig_");
  const graphApiPostId = postId.replace(/^(fb_|ig_)/, "");

  if (!accessToken) { // Fallback to mock if no token
    const mockComments: Comment[] = [
        {
            id: "comment_1",
            from: { id: "user_A", name: "Jane Doe" },
            message: "Love this! 😍",
            created_time: new Date().toISOString(),
        },
        {
            id: "comment_2",
            username: "JohnSmithIG",
            message: "Great post, very informative.",
            created_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
    ];
    return NextResponse.json(mockComments);
  }

  const fieldsToFetch = isInstagramPost 
    ? "id,text,username,timestamp,like_count,replies"
    : "id,from,message,created_time,like_count,comment_count";
  
  const commentsApiUrl = `https://graph.facebook.com/v19.0/${graphApiPostId}/comments?fields=${fieldsToFetch}&access_token=${accessToken}`;

  try {
    const apiResponse = await fetch(commentsApiUrl);
    const responseData = await apiResponse.json() as MetaApiResponse; // Assert type after parsing

    if (!apiResponse.ok || responseData.error) {
      console.error("Meta API Error fetching comments:", responseData.error);
      return NextResponse.json(
        { error: responseData.error?.message || "Failed to fetch comments from Meta" },
        { status: apiResponse.status || 500 }
      );
    }
    
    if (!responseData.data) {
        console.error("Meta API Error: No data field in successful response", responseData);
        return NextResponse.json({ error: "No data received from Meta API" }, { status: 500 });
    }

    const comments: Comment[] = responseData.data.map((comment: MetaApiComment) => ({
        id: comment.id,
        from: comment.from ? { id: comment.from.id, name: comment.from.name } : undefined,
        username: comment.username,
        message: comment.message || comment.text || "",
        created_time: comment.created_time || comment.timestamp || new Date().toISOString(),
        like_count: comment.like_count,
        replies: comment.replies,
        comment_count: comment.comment_count,
    }));

    return NextResponse.json(comments);

  } catch (error) {
    console.error("Exception fetching comments:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while fetching comments.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

