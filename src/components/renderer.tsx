import Quill from "quill";
import { useEffect, useRef, useState, useMemo } from "react";
import "quill-mention/autoregister";
import MagicUrl from "quill-magic-url";
import LinkPreview from "./link-previewer";
import { useSearchParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

Quill.register("modules/magicUrl", MagicUrl);

interface RendererProps {
  value: string;
  links: string[];
  messageId?: Id<"messages">;
}

const Renderer = ({ value, links, messageId = undefined }: RendererProps) => {
  const [isEmpty, setIsEmpty] = useState(false);
  const rendererRef = useRef<HTMLDivElement>(null);
  const params = useSearchParams();
  const quill = useMemo(() => {
    const quillInstance = new Quill(document.createElement("div"), {
      theme: "snow",
    });
    quillInstance.enable(false);
    return quillInstance;
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;

    try {
      const jsonValue = JSON.parse(value);
      const container = rendererRef.current;

      quill.setContents(jsonValue);
      const cleanText = quill
        .getText()
        .replace(/<(.|\n)*?>/g, "")
        .trim();
      setIsEmpty(cleanText.length === 0);

      container.innerHTML = quill.root.innerHTML;

      // Cleanup function
      return () => {
        container.innerHTML = "";
      };
    } catch (error) {
      console.error("Error parsing Quill content:", error);
      setIsEmpty(true);
    }
  }, [value, quill]);

  if (isEmpty) return null;

  return (
    <>
      <div ref={rendererRef} className="ql-editor ql-renderer" id={messageId} />
      {links?.length > 0 && !params.has("parentMessageId") && (
        <article className="my-4 flex flex-col gap-2">
          {links.map((link, index) => (
            <LinkPreview url={link} key={`${link}-${index}`} />
          ))}
        </article>
      )}
    </>
  );
};

export default Renderer;
