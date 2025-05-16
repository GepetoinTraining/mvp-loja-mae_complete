// /home/ubuntu/mvp-loja-mae3/mvp-loja-mae/src/components/marketing/EngagementDashboardClient.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Removed unused DialogTrigger
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, SubmitHandler } from "react-hook-form"; // Added SubmitHandler
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion";
import Image from "next/image"; // Import next/image

interface Post {
  id: string;
  platform: "Facebook" | "Instagram";
  message: string;
  postedAt: string;
  mediaUrl?: string;
  igPostId?: string; 
}

interface CommentFrom {
  id: string;
  name: string;
  picture?: { data?: { url?: string } }; 
}

interface Comment {
  id: string;
  from: CommentFrom;
  message: string;
  created_time: string;
  like_count?: number;
  comment_count?: number;
  comments?: { data: Comment[] }; 
}

interface LeadFormData {
  nome: string;
  telefone: string;
  email?: string;
  observacoes?: string;
}

interface PostInsights {
  post_impressions?: number;
  post_impressions_unique?: number; 
  post_engaged_users?: number;
  post_clicks?: number;
  post_video_views?: number;
  impressions?: number;
  reach?: number;
  engagement?: number;
  saved?: number;
  video_views?: number;
  likes?: number; 
  comments?: number; 
  shares?: number; 
  [key: string]: number | undefined; // Changed from any to number | undefined for insight values
}

export default function EngagementDashboardClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [insights, setInsights] = useState<PostInsights | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [leadComment, setLeadComment] = useState<Comment | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadFormData>();

  useEffect(() => {
    async function fetchPosts() {
      setIsLoadingPosts(true);
      try {
        const response = await fetch("/api/meta/posts");
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else {
          console.error("Failed to fetch posts");
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
      setIsLoadingPosts(false);
    }
    fetchPosts();
  }, []);

  const handleFetchComments = async (post: Post) => {
    setSelectedPost(post);
    setComments([]);
    setInsights(null); 
    setIsLoadingComments(true);
    try {
      const postIdForApi = post.id;
      const response = await fetch(`/api/meta/post/${postIdForApi}/comments?platform=${post.platform.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data || []);
      } else {
        console.error(`Failed to fetch comments for post ${post.id}`);
        setComments([]);
      }
    } catch (error) {
      console.error(`Error fetching comments for post ${post.id}:`, error);
      setComments([]);
    }
    setIsLoadingComments(false);
  };

  const handleFetchInsights = async (post: Post) => {
    setSelectedPost(post); 
    setInsights(null);
    setIsLoadingInsights(true);
    try {
      const postIdForApi = post.id;
      const response = await fetch(`/api/meta/post/${postIdForApi}/insights?platform=${post.platform.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      } else {
        console.error(`Failed to fetch insights for post ${post.id}`);
        setInsights({}); 
      }
    } catch (error) {
      console.error(`Error fetching insights for post ${post.id}:`, error);
      setInsights({});
    }
    setIsLoadingInsights(false);
  };

  const handleOpenLeadModal = (comment: Comment) => {
    setLeadComment(comment);
    reset({
      nome: comment.from.name,
      observacoes: `Lead from ${selectedPost?.platform} comment on post ID ${selectedPost?.id}.\nComment: "${comment.message}"\nCommenter ID: ${comment.from.id}`,
      email: "",
      telefone: "",
    });
    setIsLeadModalOpen(true);
  };

  const handleCreateLead: SubmitHandler<LeadFormData> = async (data) => {
    if (!leadComment || !selectedPost) return;
    console.log("Simulating lead creation for:", data.nome, "from comment by", leadComment.from.name);
    alert(`Lead creation for '${data.nome}' initiated (simulated). Check console for details.`);
    setIsLeadModalOpen(false);
    setLeadComment(null);
  };

  const renderComments = (commentList: Comment[], level = 0) => {
    return commentList.map((comment) => (
      <div key={comment.id} className={`ml-${level * 4} mt-2 p-3 bg-gray-50 rounded-md border`}>
        <div className="flex items-start space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.from.picture?.data?.url} alt={comment.from.name} />
            <AvatarFallback>{comment.from.name.substring(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-gray-800">{comment.from.name}</p>
            <p className="text-xs text-gray-500">{new Date(comment.created_time).toLocaleString()}</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.message}</p>
        <div className="mt-1 flex items-center space-x-3">
          {comment.like_count !== undefined && <span className="text-xs text-gray-500">Likes: {comment.like_count}</span>}
          {comment.comment_count !== undefined && <span className="text-xs text-gray-500">Replies: {comment.comment_count}</span>}
          <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => handleOpenLeadModal(comment)}>
            Convert to Lead
          </Button>
        </div>
        {comment.comments && comment.comments.data && comment.comments.data.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-gray-200">
            {renderComments(comment.comments.data, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderInsights = (postInsights: PostInsights | null) => {
    if (!postInsights || Object.keys(postInsights).length === 0) {
      return <p className="text-sm text-gray-500">No insights available for this post or insights are still loading.</p>;
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {Object.entries(postInsights).map(([key, value]) => (
          <div key={key} className="p-2 bg-slate-50 rounded">
            <p className="font-medium text-slate-700 capitalize">{key.replace(/_/g, " ")}:</p>
            <p className="text-slate-600">{value !== undefined && value !== null ? value.toLocaleString() : "N/A"}</p>
          </div>
        ))}
      </div>
    );
  };

  if (isLoadingPosts) {
    return <p>Loading posts...</p>;
  }

  return (
    <div className="space-y-6">
      {posts.length === 0 && <p>No posts found. Try creating some posts first!</p>}
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">{post.platform} Post</CardTitle>
            <CardDescription>Posted on: {new Date(post.postedAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {post.mediaUrl && (
              <div style={{ position: "relative", width: "auto", maxHeight: "240px" }}> {/* Wrapper for Next/Image */} 
                <Image 
                    src={post.mediaUrl} 
                    alt={`Post media for ${post.id}`} 
                    width={300} // Provide appropriate width
                    height={240} // Provide appropriate height
                    style={{ objectFit: "contain", borderRadius: "0.375rem", marginBottom: "0.75rem"}} // Tailwind: rounded-md mb-3
                />
              </div>
            )}
            <p className="text-gray-700 whitespace-pre-wrap">{post.message}</p>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <div className="flex space-x-2 mb-3">
                <Button onClick={() => handleFetchComments(post)} variant="outline" size="sm">
                {selectedPost?.id === post.id && isLoadingComments ? "Loading Comments..." : "View Comments"}
                </Button>
                <Button onClick={() => handleFetchInsights(post)} variant="outline" size="sm">
                {selectedPost?.id === post.id && isLoadingInsights ? "Loading Insights..." : "View Insights"}
                </Button>
            </div>

            {selectedPost?.id === post.id && (
              <Accordion type="single" collapsible className="w-full">
                {(!isLoadingInsights && insights) && (
                    <AccordionItem value="insights">
                        <AccordionTrigger className="text-md font-semibold">Post Insights</AccordionTrigger>
                        <AccordionContent>
                            {renderInsights(insights)}
                        </AccordionContent>
                    </AccordionItem>
                )}
                {(!isLoadingComments && comments.length > 0) && (
                    <AccordionItem value="comments">
                        <AccordionTrigger className="text-md font-semibold">Comments ({comments.length})</AccordionTrigger>
                        <AccordionContent>
                            {renderComments(comments)}
                        </AccordionContent>
                    </AccordionItem>
                )}
                 {!isLoadingComments && comments.length === 0 && selectedPost?.id === post.id && !isLoadingInsights && !insights && (
                    <p className="text-sm text-gray-500 py-2">No comments or insights loaded yet. Click buttons above.</p>
                 )}
                 {!isLoadingComments && comments.length === 0 && selectedPost?.id === post.id && (
                    <AccordionItem value="comments_empty">
                        <AccordionTrigger className="text-md font-semibold">Comments</AccordionTrigger>
                        <AccordionContent>
                            <p>No comments found for this post.</p>
                        </AccordionContent>
                    </AccordionItem>
                 )
                 }
              </Accordion>
            )}
          </CardFooter>
        </Card>
      ))}

      <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convert Comment to Lead</DialogTitle>
            <DialogDescription>
              Create a new lead based on this comment. Fill in any additional details.
            </DialogDescription>
          </DialogHeader>
          {leadComment && (
            <div className="mb-4 p-3 bg-gray-100 rounded-md text-sm">
                <p><strong>Commenter:</strong> {leadComment.from.name}</p>
                <p><strong>Comment:</strong> &quot;{leadComment.message}&quot;</p> {/* Escaped quotes */} 
            </div>
          )}
          <form onSubmit={handleSubmit(handleCreateLead)} className="space-y-4">
            <div>
              <Label htmlFor="nome">Lead Name</Label>
              <Input id="nome" {...register("nome", { required: "Name is required" })} />
              {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
            </div>
            <div>
              <Label htmlFor="telefone">Phone</Label>
              <Input id="telefone" {...register("telefone", { required: "Phone is required" })} />
               {errors.telefone && <p className="text-xs text-red-500 mt-1">{errors.telefone.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
            <div>
              <Label htmlFor="observacoes">Observations (auto-filled)</Label>
              <Textarea id="observacoes" {...register("observacoes")} rows={4}/>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create Lead (Simulated)</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

