import React, {
  MutableRefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Quill, { QuillOptions } from "quill";
import { Delta, Op } from "quill/core";
import { usePathname } from "next/navigation";
import Image from "next/image";
import "quill/dist/quill.snow.css";
import "quill-mention/autoregister";
import MagicUrl from "quill-magic-url";

import { Button } from "./ui/button";
import { PiTextAa } from "react-icons/pi";
import {
  Loader2,
  Smile,
  XIcon,
  FileText,
  Film,
  Music,
  File as FileIcon,
} from "lucide-react";
import { MdSend } from "react-icons/md";
import Hint from "./hint";
import EmojiPopover from "./emoji-popover";
import { cn, UploadButton } from "@/lib/utils";
import { useGetSuggestions } from "@/features/suggestion/api/use-get-suggestion";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { Id } from "../../convex/_generated/dataModel";
import { UseGetIsProUser } from "@/features/subscription/api/use-get-is-pro-user";

Quill.register("modules/magicUrl", MagicUrl);

// Enhanced type definitions
type FileInfo = {
  url: string;
  type: string;
  name: string;
};

type EditorValue = {
  body: string;
  files?: string[];
};

type SuggestionValue = {
  id: Id<"members"> | Id<"channels">;
  value?: string;
};

interface EditorProps {
  onSubmit: ({ files, body }: EditorValue) => void;
  onCancel?: () => void;
  placeHolder?: string;
  defaultValue?: Delta | Op[];
  disabled?: boolean;
  innerRef?: MutableRefObject<Quill | null>;
  variant?: "create" | "update";
}

const Editor = ({
  variant = "create",
  placeHolder = "Write something...",
  defaultValue = [],
  disabled = false,
  onSubmit,
  innerRef,
  onCancel,
}: EditorProps) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false);

  const pathName = usePathname();
  const isDMs = pathName.includes("member");
  const workspaceId = useWorkSpaceId();
  const { data, isLoading } = useGetSuggestions({
    isNeedUser: !isDMs,
    workspaceId,
  });
  const { data: isPro } = UseGetIsProUser({});

  const containerRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef(onSubmit);
  const placeHolderRef = useRef(placeHolder);
  const quillRef = useRef<Quill | null>(null);
  const defaultValueRef = useRef(defaultValue);
  const disabledRef = useRef(disabled);
  const channelsRef = useRef<null | SuggestionValue[]>(null);
  const workspaceMembersRef = useRef<null | SuggestionValue[]>(null);

  useEffect(() => {
    if (!isLoading && Array.isArray(data) && data.length == 2) {
      workspaceMembersRef.current = [...data[0]];
      channelsRef.current = data[1];
    } else if (data?.length == 1) {
      channelsRef.current = data[0];
    }
  }, [isLoading, data]);

  useLayoutEffect(() => {
    submitRef.current = onSubmit;
    placeHolderRef.current = placeHolder;
    defaultValueRef.current = defaultValue;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const editorContainer = container.appendChild(
      container.ownerDocument.createElement("div")
    );
    const showProOption = isPro == true ? true : false;

    const toolbar = !showProOption
      ? [
          ["bold", "italic", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
        ]
      : [
          ["bold", "italic", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [
            {
              color: [
                false,
                "#000000",
                "#e60000",
                "#ff9900",
                "#ffff00",
                "#008a00",
                "#0066cc",
                "#9933ff",
                "#ffffff",
                "#facccc",
                "#ffebcc",
                "#ffffcc",
                "#cce8cc",
                "#cce0f5",
                "#ebd6ff",
                "#bbbbbb",
                "#f06666",
                "#ffc266",
                "#ffff66",
                "#66b966",
                "#66a3e0",
                "#c285ff",
                "#888888",
                "#a10000",
                "#b26b00",
                "#b2b200",
                "#006100",
                "#0047b2",
                "#6b24b2",
                "#444444",
                "#5c0000",
                "#663d00",
                "#666600",
                "#003700",
                "#002966",
                "#3d1466",
              ],
            },
            {
              background: [
                false,
                "#000000",
                "#e60000",
                "#ff9900",
                "#ffff00",
                "#008a00",
                "#0066cc",
                "#9933ff",
                "#ffffff",
                "#facccc",
                "#ffebcc",
                "#ffffcc",
                "#cce8cc",
                "#cce0f5",
                "#ebd6ff",
                "#bbbbbb",
                "#f06666",
                "#ffc266",
                "#ffff66",
                "#66b966",
                "#66a3e0",
                "#c285ff",
                "#888888",
                "#a10000",
                "#b26b00",
                "#b2b200",
                "#006100",
                "#0047b2",
                "#6b24b2",
                "#444444",
                "#5c0000",
                "#663d00",
                "#666600",
                "#003700",
                "#002966",
                "#3d1466",
              ],
            },
          ],
        ];

    const options: QuillOptions = {
      theme: "snow",
      placeholder: placeHolderRef.current,
      modules: {
        magicUrl: true,
        mention: {
          allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
          mentionDenotationChars: isDMs ? ["#"] : ["@", "#"],
          source: function (
            searchTerm: string,
            renderList: (values: SuggestionValue[], searchTerm: string) => void,
            mentionChar: string
          ) {
            const values =
              mentionChar === "#"
                ? channelsRef.current
                : workspaceMembersRef.current;

            if (!values) return;

            if (searchTerm.length === 0) {
              renderList(values, searchTerm);
            } else {
              const matches = values.filter((value) =>
                value.value?.toLowerCase().includes(searchTerm.toLowerCase())
              );
              renderList(matches, searchTerm);
            }
          },
        },
        toolbar: toolbar,
        keyboard: {
          bindings: {
            enter: {
              key: "Enter",
              handler: () => {
                const text = quill.getText();
                const isEmpty =
                  files?.length == 0 &&
                  text.replace(/<(.|\n)*?>/g, "").trim().length === 0;

                if (isEmpty || isUploadingFiles) return;
                const body = JSON.stringify(quill.getContents());
                const fileUrl = files.map((file) => file.url);

                submitRef.current?.({ body, files: fileUrl });

                setFiles([]);
              },
            },
          },
        },
      },
    };

    const quill = new Quill(editorContainer, options);
    quillRef.current = quill;
    quillRef.current.focus();

    if (innerRef) {
      innerRef.current = quill;
    }

    quill.setContents(defaultValueRef.current);
    setText(quill.getText());

    quill.on(Quill.events.TEXT_CHANGE, () => {
      setText(quill.getText());
    });

    return () => {
      quill.off(Quill.events.TEXT_CHANGE);
      if (container) container.innerHTML = "";
      if (quillRef.current) quillRef.current = null;
      if (innerRef) innerRef.current = null;
    };
  }, [
    innerRef,
    channelsRef,
    workspaceMembersRef,
    files,
    isPro,
    isUploadingFiles,
    isDMs,
  ]);

  const toggleToolbar = () => {
    setIsToolbarVisible((cur) => !cur);
    const toolbarElement = containerRef.current?.querySelector(".ql-toolbar");
    if (toolbarElement) {
      toolbarElement.classList.toggle("hidden");
    }
  };

  const onEmojiSelect = (emojiValue: string) => {
    const quill = quillRef.current;
    quill?.insertText(quill?.getSelection()?.index || 0, emojiValue);
  };

  const handleFileRemove = async (url: string) => {
    try {
      setIsDeleting(true);
      const fileKey = url?.split("/").pop();
      if (!fileKey) {
        throw new Error("Could not determine file key");
      }

      const response = await fetch("/api/uploadthing/file", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete file");
      }

      setFiles((prev) => prev.filter((file) => file.url !== url));
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete file. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = () => {
    if (isUploadingFiles) {
      return;
    }
    const fileUrl = files.map((file) => file.url);

    onSubmit({
      body: JSON.stringify(quillRef?.current?.getContents()),
      files: fileUrl,
    });

    setFiles([]);
  };

  const renderFilePreview = (file: FileInfo) => {
    const mainType = file.type.split("/")[0];
    const specificType = file.type;

    switch (mainType) {
      case "image":
        return (
          <Image
            src={file.url}
            alt={file.name}
            sizes="62"
            fill
            className="rounded-xl overflow-hidden border object-cover"
          />
        );
      case "video":
        return <Film className="w-8 h-8 text-gray-400" />;
      case "audio":
        return <Music className="w-8 h-8 text-gray-400" />;
      default:
        if (specificType.includes("pdf")) {
          return <FileText className="w-8 h-8 text-gray-400" />;
        }
        return <FileIcon className="w-8 h-8 text-gray-400" />;
    }
  };

  const isEmpty =
    files?.length == 0 && text.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex flex-col border border-slate-200 rounded-md focus-within:border-slate-300 focus-within:shadow-sm transition bg-white",
          disabled && "opacity-50"
        )}
      >
        <div ref={containerRef} className="h-full ql-custom" />

        <div className="flex">
          {files.map((file) => (
            <div className="p-2" key={file.url}>
              <div className="relative size-[62px] flex items-center justify-center group/image">
                <Hint label="Remove file">
                  <button
                    type="button"
                    disabled={disabled || isDeleting}
                    onClick={() => handleFileRemove(file.url)}
                    className="hidden group-hover/image:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[4] border-2 border-white justify-center items-center"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </Hint>
                {renderFilePreview(file)}
                <div
                  className={cn(
                    "absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center transition-opacity",
                    isDeleting ? "opacity-100" : "opacity-0"
                  )}
                >
                  {isDeleting && (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex px-2 pb-2">
          <Hint
            label={isToolbarVisible ? "Hide Formatting" : "Show Formatting"}
          >
            <Button
              disabled={disabled}
              size="iconSm"
              variant="ghost"
              onClick={toggleToolbar}
            >
              <PiTextAa className="size-4" />
            </Button>
          </Hint>

          <EmojiPopover onEmojiSelect={onEmojiSelect}>
            <Button disabled={disabled} size="iconSm" variant="ghost">
              <Smile className="size-4" />
            </Button>
          </EmojiPopover>

          {variant === "create" && (
            <Hint
              label={
                isPro ? "Send files" : "Send image (get pro for more options)"
              }
            >
              <div className="ml-1">
                <UploadButton
                  appearance={{
                    allowedContent: "hidden",
                    button:
                      "w-[6rem] bg-white ring-1 ring-black rounded-md !text-black  h-7 text-xs hover:bg-gray-100",
                  }}
                  endpoint={isPro ? "filesUploader" : "imageUploader"}
                  onUploadError={(error) => {
                    console.error("Upload error:", error);
                  }}
                  onUploadBegin={() => {
                    setIsUploadingFiles(true);
                  }}
                  onClientUploadComplete={(res) => {
                    files.forEach((file) => {
                      handleFileRemove(file.url);
                    });

                    res.forEach((r) => {
                      setFiles((prev) => [
                        ...prev,
                        {
                          name: r.name,
                          type: r.type,
                          url: r.url,
                        },
                      ]);
                    });
                    setIsUploadingFiles(false);
                  }}
                />
              </div>
            </Hint>
          )}

          {variant === "update" ? (
            <div className="ml-auto flex items-center gap-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={disabled}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={disabled || isEmpty}
                onClick={handleSubmit}
                className="bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
              >
                Save
              </Button>
            </div>
          ) : (
            <Button
              className={cn(
                "ml-auto",
                isEmpty
                  ? "bg-[#white] hover:bg-[#white]/80 text-muted-foreground"
                  : "bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
              )}
              size="iconSm"
              disabled={disabled || isEmpty || isUploadingFiles}
              type="submit"
              onClick={() => {
                handleSubmit();
                quillRef.current?.focus();
              }}
            >
              <MdSend className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {variant === "create" && (
        <div
          className={cn(
            "opacity-0 p-2 text-[10px] transition-opacity text-muted-foreground flex justify-end",
            !isEmpty && "opacity-100"
          )}
        >
          <p>
            <strong>Shift + Return</strong> to add a new line
          </p>
        </div>
      )}
    </div>
  );
};

export default Editor;
