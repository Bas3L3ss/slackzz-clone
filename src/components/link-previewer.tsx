import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Link as LinkIcon,
  PlayCircle,
  ExternalLink,
} from "lucide-react";

interface PreviewData {
  title?: string;
  description?: string;
  image?: string;
  videoId?: string;
  videoThumbnail?: string;
  author?: string;
}

interface LinkPreviewProps {
  url: string;
  className?: string;
  onError?: (error: Error) => void;
}

interface MetaData {
  title: string | null;
  description: string | null;
  image: string | null;
}

interface YouTubeOEmbed {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
}

const YOUTUBE_DOMAINS = ["youtube.com", "youtu.be"];

export default function LinkPreview({
  url,
  className = "",
  onError,
}: LinkPreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [imageError, setImageError] = useState(false);
  const [hostname, setHostname] = useState<string>("");

  const isYouTubeURL = (urlString: string): boolean => {
    try {
      const urlObject = new URL(urlString);
      return YOUTUBE_DOMAINS.some((domain) =>
        urlObject.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  };

  const extractYouTubeVideoId = (urlString: string): string => {
    try {
      const videoIdRegex =
        /(?:\/embed\/|\/watch\?v=|\/(?:embed\/|v\/|watch\?.*v=|youtu\.be\/|embed\/|v=))([^&?#]+)/;
      const match = urlString.match(videoIdRegex);
      return match?.[1] ?? "";
    } catch {
      return "";
    }
  };

  const fetchYouTubeData = async (videoId: string) => {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch YouTube data");
      }

      const data = (await response.json()) as YouTubeOEmbed;

      return {
        title: data.title,
        author: data.author_name,
        videoThumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoId,
      };
    } catch (error) {
      console.error("Error fetching YouTube data:", error);
      return {
        title: "YouTube Video",
        videoThumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoId,
      };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setImageError(false);

        const validatedUrl = new URL(url);
        setHostname(validatedUrl.hostname);

        if (!["http:", "https:"].includes(validatedUrl.protocol)) {
          throw new Error("Invalid URL protocol");
        }

        if (isYouTubeURL(url)) {
          const videoId = extractYouTubeVideoId(url);
          if (!videoId) throw new Error("Invalid YouTube URL");

          const youtubeData = await fetchYouTubeData(videoId);
          setPreviewData(youtubeData);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: validatedUrl.toString() }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch preview data");
        }

        const data = (await response.json()) as MetaData;
        setPreviewData({
          title: data.title ?? undefined,
          description: data.description ?? undefined,
          image: data.image ?? undefined,
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("An unknown error occurred");
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      void fetchData();
    }
  }, [url, onError]);

  if (loading) {
    return (
      <Card
        className={`overflow-hidden border-l-4 border-l-primary/20 ${className}`}
      >
        <CardContent className="p-0">
          <span className="sr-only">loading</span>
          <div className="flex flex-col md:flex-row">
            <div className="p-3 flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="md:w-64 h-32 md:h-full">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !previewData) {
    return (
      <Card
        className={`bg-destructive/5 border-l-4 border-l-destructive ${className}`}
      >
        <CardContent className="p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <div className="space-y-0.5">
            <p className="font-medium text-destructive text-sm">
              Invalid url <span className="truncate">( {url} )</span>
            </p>
            <p className="text-xs text-destructive/80">
              Be cautious when interact with this link
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card
      className={`group hover:bg-accent/50 transition-all duration-200 cursor-pointer overflow-hidden border-l-4 border-l-primary/20 ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="p-3 flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LinkIcon className="h-4 w-4" />
              <span>{hostname}</span>
              {previewData.author && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span>{previewData.author}</span>
                </>
              )}
            </div>

            <div className="space-y-1">
              {previewData.title && (
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {previewData.title}
                </h3>
              )}
              {previewData.description && (
                <p className="text-muted-foreground text-xs line-clamp-2">
                  {previewData.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground/80 group-hover:text-primary/80 transition-colors">
              <ExternalLink className="h-3 w-3" />
              <span>{previewData.videoId ? "Watch video" : "Open link"}</span>
            </div>
          </div>

          {(previewData.videoId || (previewData.image && !imageError)) && (
            <div className="relative w-full md:w-64 h-32 overflow-hidden bg-black/5">
              {previewData.videoId ? (
                <>
                  {previewData.videoThumbnail && !imageError && (
                    <img
                      //   src={previewData.videoThumbnail}
                      src={
                        previewData.videoThumbnail
                          ? `/api/image-proxy?url=${encodeURIComponent(previewData.videoThumbnail)}&w=500`
                          : previewData.videoThumbnail
                      }
                      alt="Video Thumbnail"
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      onError={handleImageError}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <PlayCircle className="w-10 h-10 text-white drop-shadow-lg transform group-hover:scale-110 transition-transform" />
                  </div>
                </>
              ) : (
                <img
                  src={
                    previewData.image
                      ? `/api/image-proxy?url=${encodeURIComponent(previewData.image)}&w=500`
                      : previewData.image
                  }
                  alt={previewData.title || "Link Preview"}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  onError={handleImageError}
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
