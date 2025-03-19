import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRemoveWorkspace } from "@/features/workspaces/api/use-remove-workspace";
import { useUpdateWorkspace } from "@/features/workspaces/api/use-update-workspace";
import useConfirm from "@/hooks/use-confirm-tsx";
import { useWorkSpaceId } from "@/hooks/use-workspace-id";
import { cn, handleImageUpload, UploadButton } from "@/lib/utils";
import { Loader2, TrashIcon, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

interface PreferencesModal {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialValue: { workspaceName: string; imageUrl: string | undefined };
}

const PreferencesModal = ({
  initialValue,
  open,
  setOpen,
}: PreferencesModal) => {
  const workspaceId = useWorkSpaceId();
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [editOpen, setEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] =
    useState<boolean>(false);

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action is irreversible"
  );

  const deleteImage = async (image: string) => {
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
      setValue((prev) => ({
        ...prev,
        imageUrl: undefined,
      }));
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

  const { mutate: updateWorkspace, isPending: isUpdateWorkspaceUpdating } =
    useUpdateWorkspace();
  const { mutate: removeWorkspace, isPending: isUpdateWorkspaceRemoving } =
    useRemoveWorkspace();

  const handleRemove = async () => {
    const ok = await confirm();
    if (!ok) return;
    setIsDeletingWorkspace(true);

    if (value.imageUrl) {
      const fileKey = value.imageUrl?.split("/").pop();
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
      setValue((prev) => ({
        ...prev,
        imageUrl: undefined,
      }));
      if (!response.ok) {
        throw new Error("Failed to delete workspace, try again");
      }
    }
    removeWorkspace(
      {
        id: workspaceId,
      },
      {
        onSuccess: () => {
          toast.success("Workspace removed");
          router.replace("/");
        },
        onError: () => {
          toast.error("Can't remove workspace");
        },
      }
    );
    setIsDeletingWorkspace(true);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateWorkspace(
      {
        id: workspaceId,
        name: value.workspaceName,
        imageUrl: value.imageUrl,
      },
      {
        onSuccess: () => {
          toast.success("Workspace updated");
          setEditOpen(false);
        },
        onError: () => {
          toast.error("Can't update workspace");
        },
      }
    );
  };
  return (
    <>
      <ConfirmDialog />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 bg-gray-50 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-white">
            <DialogTitle>{value.workspaceName}</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4 flex flex-col gap-y-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <div className="px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Workspace details</p>
                    <p className="text-sm text-[#1264a3] hover:underline font-semibold">
                      Edit
                    </p>
                  </div>
                  <p className="text-sm">{value.workspaceName}</p>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit this workspace</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 " onSubmit={handleEdit}>
                  <Input
                    value={value.workspaceName}
                    disabled={isUpdateWorkspaceUpdating}
                    onChange={(e) =>
                      setValue((prev) => ({
                        ...prev,
                        workspaceName: e.target.value,
                      }))
                    }
                    autoFocus
                    required
                    minLength={3}
                    maxLength={80}
                    placeholder="Workspace name e.g. 'Work', 'Personal', 'Home'"
                  />
                  {value.imageUrl ? (
                    <div key={value.imageUrl} className="relative group">
                      <button
                        type="button"
                        onClick={() => deleteImage(value.imageUrl!)}
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
                          src={value.imageUrl}
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
                      onClientUploadComplete={(res) => {
                        setValue((prev) => ({
                          ...prev,
                          imageUrl: res[0].url,
                        }));
                      }}
                      onUploadError={(error: Error) => {
                        console.log(`ERROR! ${error.message}`);
                      }}
                      onBeforeUploadBegin={handleImageUpload}
                    />
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        variant={"outline"}
                        disabled={isUpdateWorkspaceRemoving}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button disabled={isUpdateWorkspaceRemoving}>Save</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <button
              disabled={isDeletingWorkspace}
              onClick={handleRemove}
              className={` flex items-center gap-x-2 px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 text-rose-600 ${isDeletingWorkspace && "  hover:cursor-not-allowed "}`}
            >
              <TrashIcon className="size-4" />
              <p className="text-sm font-semibold">Delete workspace</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PreferencesModal;
