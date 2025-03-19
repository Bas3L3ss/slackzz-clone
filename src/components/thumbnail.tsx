import React, { useState, useEffect } from "react";
import { File, FileText, Film, Music, Code, Loader2 } from "lucide-react";
import Image from "next/image";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const ThumbNail = React.memo(({ url }: { url: string }) => {
  const [fileType, setFileType] = useState<string | undefined>(undefined);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFileMetadata = async () => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        const contentType = response.headers.get("Content-Type") || "";
        setFileType(contentType);

        // Attempt to fetch content for text/code files
        if (contentType.startsWith("text/")) {
          const contentResponse = await fetch(url);
          const content = await contentResponse.text();
          setFileContent(content);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching file metadata:", error);
        setIsLoading(false);
      }
    };
    fetchFileMetadata();
  }, [url]);

  const renderLoadingState = () => (
    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
    </div>
  );

  const renderCodeOrTextPreview = (content: string, isCode: boolean) => {
    const maxPreviewLines = 10;
    const lines = content.split("\n").slice(0, maxPreviewLines);

    return (
      <div className="relative w-full bg-gray-100 rounded-lg p-4 flex flex-col space-y-2">
        {isCode ? (
          <Code className="w-8 h-8 text-gray-400" />
        ) : (
          <FileText className="w-8 h-8 text-gray-400" />
        )}
        <pre className="text-xs overflow-x-auto max-h-48 text-gray-700">
          {lines.map((line, index) => (
            <code key={index} className="block">
              {line}
            </code>
          ))}
          {content.split("\n").length > maxPreviewLines && (
            <div className="text-gray-500 italic">... (truncated)</div>
          )}
        </pre>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline self-start"
        >
          {isCode ? "View Code File" : "View Text File"}
        </a>
      </div>
    );
  };

  const renderFilePreview = () => {
    if (isLoading) return renderLoadingState();

    const mainType = fileType?.split("/")[0];
    const subType = fileType?.split("/")[1];

    switch (mainType) {
      case "image":
        return (
          <article className="relative overflow-hidden border max-h-64 rounded-lg my-2 w-fit cursor-zoom-in">
            <Zoom>
              <Image
                src={url}
                alt="Message Image"
                width={500}
                height={500}
                sizes="(max-width: 768px) 100vw, 500px"
                className="rounded-md object-cover"
                style={{ width: "auto", height: "auto" }}
                loading="lazy"
              />
            </Zoom>
          </article>
        );
      case "video":
        return (
          <div className="relative w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-400" />
            <video
              src={url}
              controls
              className="absolute inset-0 w-full h-full rounded-lg"
            />
          </div>
        );
      case "audio":
        return (
          <div className="relative w-full bg-gray-100 rounded-lg p-4 flex items-center space-x-4">
            <Music className="w-8 h-8 text-gray-400" />
            <audio src={url} controls className="w-full" />
          </div>
        );
      case "text":
        // Handle text files with code-like syntax
        const isCodeFile =
          subType?.includes("javascript") ||
          subType?.includes("typescript") ||
          subType?.includes("python") ||
          subType?.includes("html") ||
          subType?.includes("css") ||
          subType?.includes("json");

        return fileContent ? (
          renderCodeOrTextPreview(fileContent, isCodeFile!)
        ) : (
          <div className="relative w-full bg-gray-100 rounded-lg p-4 flex items-center space-x-4">
            <FileText className="w-8 h-8 text-gray-400" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Text File
            </a>
          </div>
        );
      default:
        if (fileType?.includes("pdf")) {
          return (
            <div className="relative w-full bg-gray-100 rounded-lg p-4 flex items-center space-x-4">
              <FileText className="w-8 h-8 text-gray-400" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View PDF
              </a>
            </div>
          );
        }
        return (
          <div className="relative w-full bg-gray-100 rounded-lg p-4 flex items-center space-x-4">
            <File className="w-8 h-8 text-gray-400" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Download File
            </a>
          </div>
        );
    }
  };

  return renderFilePreview();
});

ThumbNail.displayName = "ThumbNail";

export default ThumbNail;
