// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/app/api/meta/post/[postId]/insights/route.ts
import { NextRequest, NextResponse } from "next/server";

// Placeholder for fetching user-specific Meta access token
async function getMetaAccessToken(userId: string): Promise<string | undefined> {
  // TODO: Replace with actual database lookup for the user_s stored Meta Page Access Token
  console.warn(`[Meta Insights API] DB lookup for Meta Page Access Token for user ${userId} is deferred. Using placeholder if available.`);
  return process.env.PLACEHOLDER_FB_PAGE_ACCESS_TOKEN; // This token needs pages_read_engagement and/or instagram_basic + instagram_manage_insights
}

interface InsightValue {
    value: number | Record<string, number>; // Value can be a number or an object for breakdowns
    // Other properties if present in Meta_s response for insight values
}

interface Insight {
    name: string;
    period: string;
    values: InsightValue[];
    title: string;
    description: string;
    id: string;
}

interface FormattedInsights {
    [key: string]: number | Record<string, number>;
}

// Interface for the expected Meta API response structure for insights
interface MetaInsightsApiResponse {
    data?: Insight[];
    error?: {
        message: string;
        type?: string;
        code?: number;
        fbtrace_id?: string;
    };
    // Potentially other fields from Meta API
}

export async function GET(
  request: NextRequest // Use NextRequest to access nextUrl
): Promise<Response> { // Return type should be Promise<Response>
  const userId = "placeholder_user_id"; // Replace with actual user ID from session

  // Extract postId from the URL path
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/");
  // Expected structure: ["", "api", "meta", "post", "<postId>", "insights"]
  const postId = segments.length === 6 ? segments[4] : undefined;
  
  const platform = request.nextUrl.searchParams.get("platform");

  if (!postId) {
    return NextResponse.json({ error: "Post ID could not be determined from URL" }, { status: 400 });
  }

  if (!platform || (platform !== "facebook" && platform !== "instagram")) {
    return NextResponse.json({ error: "Platform query parameter (facebook or instagram) is required." }, { status: 400 });
  }

  const accessToken = await getMetaAccessToken(userId);
  if (!accessToken) {
    console.warn("[Meta Insights API] Missing Meta Page Access Token. Actual API call will fail. Returning mock for now.");
    const mockInsights: FormattedInsights = {
        impressions: Math.floor(Math.random() * 10000),
        reach: Math.floor(Math.random() * 5000),
        engagement: Math.floor(Math.random() * 500),
        likes: Math.floor(Math.random() * 200),
    };
    return NextResponse.json(mockInsights);
  }

  let insightsApiUrl: string;
  let metrics: string;

  if (platform === "facebook") {
    metrics = "post_impressions,post_impressions_unique,post_engaged_users,post_reactions_by_type_total,post_clicks,post_video_views";
    insightsApiUrl = `https://graph.facebook.com/v19.0/${postId}/insights?metric=${metrics}&access_token=${accessToken}`;
  } else { // platform === "instagram"
    metrics = "impressions,reach,engagement,saved,video_views,likes,comments,shares";
    insightsApiUrl = `https://graph.facebook.com/v19.0/${postId}/insights?metric=${metrics}&access_token=${accessToken}`;
  }

  try {
    const apiResponse = await fetch(insightsApiUrl, { method: "GET" });
    const responseData = await apiResponse.json() as MetaInsightsApiResponse; // Assert type after parsing

    if (!apiResponse.ok || responseData.error) {
      console.error(`Error fetching ${platform} insights:`, responseData.error);
      return NextResponse.json({ error: responseData.error?.message || `Failed to fetch ${platform} insights.` }, { status: apiResponse.status || 500 });
    }
    
    if (!responseData.data) {
        console.error(`Meta API Error: No data field in successful ${platform} insights response`, responseData);
        return NextResponse.json({ error: `No data received from ${platform} Meta API for insights` }, { status: 500 });
    }

    const formattedInsights: FormattedInsights = {};
    responseData.data.forEach((insight: Insight) => {
        if (insight.values && insight.values.length > 0) {
            const value = insight.values[0].value;
            if (typeof value === "number" || (typeof value === "object" && value !== null && !Array.isArray(value))) {
                formattedInsights[insight.name] = value as number | Record<string, number>;
            } else {
                console.warn(`Unexpected value type for insight "${insight.name}":`, value);
            }
        }
    });

    return NextResponse.json(formattedInsights);

  } catch (error) {
    console.error(`Exception fetching ${platform} insights:`, error);
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

