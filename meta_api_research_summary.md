# Meta API Research Summary for Social Media Management & Lead Generation Feature

This document summarizes the findings from researching the Meta Graph API (for Facebook) and Instagram Graph API for the purpose of implementing a feature to allow marketers to publish content, track engagement, and generate leads.

## 1. Authentication & Authorization

*   **Mechanism**: OAuth 2.0 is the standard authentication method.
*   **User Type**: The integration will primarily target Instagram Professional Accounts (Business or Creator) and Facebook Pages.
*   **Login Flow**: Facebook Login for Business is recommended as it provides access to both Facebook Page and associated Instagram Professional Account assets.
*   **Access Tokens**:
    *   **Facebook Page Access Token**: Required for actions on Facebook Pages (posting, reading engagement, insights). These are generally long-lived if generated correctly (server-side OAuth flow).
    *   **Instagram User Access Token**: Can be used for Instagram-specific actions if using Instagram Login, but Facebook Login with Page permissions is often more comprehensive for business integrations.
*   **Permissions (Facebook Login for Business)**:
    *   `business_management`: To manage business assets.
    *   `pages_manage_posts`: To publish posts to a Facebook Page.
    *   `pages_read_engagement`: To read comments, reactions, and other engagement on Facebook Page posts.
    *   `pages_show_list`: To list the Facebook Pages the user manages.
    *   `instagram_basic`: To get basic metadata about the Instagram Professional Account linked to a Facebook Page.
    *   `instagram_content_publish`: To publish content (photos, videos, carousels, reels) to an Instagram Professional Account.
    *   `instagram_manage_comments`: To read and manage comments on Instagram posts (potentially for lead generation).
    *   `instagram_manage_insights`: To get insights (reach, impressions, engagement) for Instagram posts and profiles.
    *   Potentially `ads_management` and `ads_read` if the Page is managed via Business Manager and the user has a role on the Page through it.
*   **App Review**: Meta requires apps to undergo App Review for most permissions, especially those involving content publishing (`pages_manage_posts`, `instagram_content_publish`) and accessing user data. This process needs to be factored into development timelines.
*   **Page Publishing Authorization (PPA)**: Some Facebook Pages require PPA to be completed by a Page admin before an app can publish content on their behalf. Users should be advised to complete this if necessary.

## 2. Facebook Page Content Publishing

*   **Endpoint**: `POST /{page-id}/feed`
*   **Content Types**:
    *   **Text Posts**: Using the `message` parameter.
    *   **Link Posts**: Using the `link` parameter (often with `message`).
    *   **Photo Posts**: Using the `source` parameter with a publicly accessible URL to the image, or by uploading a photo to `/{page-id}/photos` first and then using the returned photo ID with `object_attachment` in the `/feed` post.
    *   **Video Posts**: Using the `source` parameter with a publicly accessible URL to the video, or by uploading to `/{page-id}/videos` (supports resumable uploads for large files) and then using the returned video ID.
*   **Scheduling**: The `scheduled_publish_time` parameter (Unix timestamp) can be used to schedule posts. The `published` parameter should be set to `false`.
*   **Targeting**: Limited feed targeting options are available (e.g., by location, language) but are more relevant for ads.

## 3. Instagram Content Publishing

*   **Target Accounts**: Only Instagram Professional Accounts (Business or Creator) are supported.
*   **Process**: Two-step process:
    1.  **Create Media Container**: `POST /{ig-user-id}/media`
        *   Parameters vary by media type:
            *   **Image (JPEG only)**: `image_url` (publicly accessible), `caption`, `user_tags`, `location_id`.
            *   **Video**: `video_url` (publicly accessible), `media_type=VIDEO`, `caption`, `user_tags`, `location_id`, `thumb_offset`.
            *   **Carousel**: `media_type=CAROUSEL`, `children` (list of image/video container IDs created similarly but without publishing), `caption`.
            *   **Reels**: `media_type=REELS`, `video_url`, `caption`, `share_to_feed` (optional).
        *   This endpoint returns a container ID.
    2.  **Publish Media Container**: `POST /{ig-user-id}/media_publish?creation_id={container-id}`
        *   This publishes the content from the container.
*   **Resumable Uploads**: For large videos, resumable uploads are possible using `rupload.facebook.com` after initiating a resumable session.
*   **Limitations**:
    *   Only JPEG images are supported.
    *   Shopping tags, branded content tags, and filters are not supported via the API.
    *   Rate Limit: 50 API-published posts per Instagram account within a 24-hour moving period (carousels count as one). Checked via `GET /{ig-user-id}/content_publishing_limit`.
    *   Media must be hosted on a publicly accessible server.
*   **Alt Text**: The `alt_text` field is available for image posts.

## 4. Engagement Tracking & Reading Content

*   **Facebook Page Posts**:
    *   **Reading Posts**: `GET /{page-id}/posts` or `GET /{post-id}`.
    *   **Comments**: `GET /{post-id}/comments` (can also post comments with `POST`).
    *   **Reactions**: `GET /{post-id}/reactions`.
    *   **Insights**: `GET /{post-id}/insights` (for post-level metrics like reach, impressions, engagement) or `GET /{page-id}/insights` (for Page-level metrics).
*   **Instagram Posts**:
    *   **Reading Media**: `GET /{ig-media-id}` with fields like `caption`, `comments_count`, `like_count`, `media_type`, `media_url`, `permalink`, `timestamp`.
    *   **Comments**: `GET /{ig-media-id}/comments` (can also post, hide, reply to comments with appropriate permissions like `instagram_manage_comments`).
    *   **Likes**: `like_count` is a field on the media object. Individual likers are not typically available for business accounts via API to protect privacy.
    *   **Insights**: `GET /{ig-media-id}/insights` with metrics like `engagement`, `impressions`, `reach`, `saved`. Also `GET /{ig-user-id}/insights` for account-level data.
        *   Requires `instagram_manage_insights` permission.

## 5. Lead Conversion Strategy (Initial Thoughts)

*   **Monitoring**: The application will fetch comments on published posts (Facebook & Instagram).
*   **Marketer Review**: A UI will be needed for the Marketer to review these comments.
*   **Manual Conversion**: The Marketer can then manually identify potential leads from comments (e.g., users expressing interest).
*   **Lead Creation**: An action in the UI will allow the Marketer to create a new Lead in the CRM, potentially pre-filling information if the commenter's profile details are accessible (limited by privacy) or prompting the marketer to gather more info.
*   **Direct Messages**: Responding to comments by suggesting a DM, or if the API allows initiating a private reply (e.g., Facebook Page private replies to comments), could be a way to gather more details for lead creation.

## 6. Key Considerations & Next Steps

*   **User Experience**: The UI for connecting Meta accounts, composing posts, viewing engagement, and converting leads needs to be intuitive.
*   **Error Handling**: Robust error handling for API responses (rate limits, permission issues, content validation errors) is critical.
*   **Webhooks**: Implementing webhooks (e.g., for Facebook Page mentions, Instagram comment notifications) can provide real-time updates rather than relying solely on polling.
*   **Instagram Stories**: Publishing to Instagram Stories has separate considerations and endpoints (`/{ig-user-id}/stories`) and might be a future enhancement.
*   **WhatsApp**: Integration with WhatsApp Business API is a separate, more complex undertaking and should be treated as a distinct future phase after Facebook/Instagram functionality is stable.

This research provides a solid foundation for proceeding with the phased implementation:
1.  **Phase 1 (Meta Posting)**: Focus on authentication and publishing to Facebook Pages and Instagram Feeds.
2.  **Phase 2 (Engagement & Lead Conversion)**: Implement fetching comments/reactions and the UI/workflow for marketers to convert interactions into leads.
3.  **Phase 3 (Basic Analytics)**: Display key post performance metrics.

Further detailed exploration of specific insight metrics and webhook capabilities will be done as each phase is approached.
