import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import { ThreadSummary } from "../../convex/thread";
import { OurFileRouter } from "@/app/api/uploadthing/_core";
import imageCompression from "browser-image-compression";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const filterThreads = (threads: ThreadSummary[], searchTerm: string) => {
  if (searchTerm.length == 0) return threads;
  return threads.filter(
    (thread) =>
      thread.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const sortThreads = (
  threads: ThreadSummary[],
  sortBy: string,
  sortOrder: "asc" | "desc"
) => {
  return [...threads].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "lastReplyAt":
        comparison = a.lastReplyAt - b.lastReplyAt;
        break;
      case "participantCount":
        comparison = a.participantCount - b.participantCount;
        break;
      case "replyCount":
        comparison = a.replyCount - b.replyCount;
        break;
      default:
        return 0;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });
};
export const getPristineUrl = (url: string): string => {
  try {
    const urlObject = new URL(url, window.location.origin);
    urlObject.search = "";
    urlObject.hash = "";

    const pristineUrl = `${window.location.origin}${urlObject.pathname}`;
    return pristineUrl;
  } catch {
    return url;
  }
};

export const handleImageUpload = async (file: File[]): Promise<File[]> => {
  try {
    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 500,
      quality: 0.3,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file[0], options);

    return [compressedFile];
  } catch (error) {
    console.error("Error compressing image:", error);
    return file;
  }
};
