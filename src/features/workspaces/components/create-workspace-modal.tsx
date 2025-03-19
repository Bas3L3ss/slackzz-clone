import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateWorkspace } from "../api/use-create-workspace";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateWorkspaceModal } from "../store/use-get-workspace-modal";
import { cn, handleImageUpload, UploadButton } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import Image from "next/image";

const CreateWorkspaceModal = () => {
  const [open, setOpen] = useCreateWorkspaceModal();
  const { mutate, isPending } = useCreateWorkspace();
  const [name, setName] = useState("");
  const router = useRouter();
  const [uploading, setUploading] = useState(false); // State for controlling upload status
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [image, setImage] = useState<string | undefined>(undefined);

  const deleteImage = async () => {
    try {
      setIsDeleting(true);
      const fileKey = image?.split("/").pop();
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
      setImage(undefined);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate(
      { name, imageUrl: image },
      {
        onSuccess(id) {
          toast.success("Workspace created");
          router.push(`/workspace/${id}`);
          setImage(undefined);
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setOpen(false);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a workspace</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            disabled={isPending}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            minLength={3}
            placeholder="Workspace name e.g. 'Work', 'Personal', 'Home'"
          />
          {image ? (
            <div key={image} className="relative group">
              <button
                type="button"
                onClick={() => deleteImage()}
                disabled={isDeleting}
                className={cn(
                  "absolute -top-2 -right-2 z-10 bg-red-500 text-white p-1 rounded-full",
                  "transition-all duration-200",
                  isDeleting
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-0 group-hover:opacity-100 hover:bg-red-600"
                )}
              >
                <X className="w-4 h-4" />
              </button>
              <div className="relative w-full h-48">
                <Image
                  src={image}
                  alt={"Workspace image"}
                  fill
                  className="object-cover rounded-lg "
                />
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
          ) : (
            <UploadButton
              endpoint="imageUploader"
              onUploadBegin={() => {
                setUploading(true);
              }}
              onClientUploadComplete={(res) => {
                setImage(res[0].url);
                setUploading(false);
              }}
              onUploadError={(error: Error) => {
                console.log(`ERROR! ${error.message}`);
                setUploading(false);
              }}
              onBeforeUploadBegin={handleImageUpload}
            />
          )}
          <div className="flex justify-end">
            <Button disabled={isPending || uploading}>Create</Button>{" "}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceModal;
