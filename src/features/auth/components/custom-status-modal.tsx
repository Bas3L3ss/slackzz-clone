import React, { useState } from "react";
import { SmileIcon, Clock3, CalendarIcon } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateUserStatus } from "@/features/status/api/use-update-user-status";
import { toast } from "sonner";
import { Doc } from "../../../../convex/_generated/dataModel";

const formSchema = z.object({
  emoji: z.string().optional(),
  status: z.string().max(128, "Status must be less than 128 characters"),
  expireTime: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const HOUR_IN_MS = 3600000;
const WEEK_IN_MS = 604800000;

const getExpirationOptions = () => [
  { label: "Don't clear", value: "dont_clear" },
  { label: "1 hour", value: "1_hour" },
  { label: "4 hours", value: "4_hours" },
  { label: "Today", value: "today" },
  { label: "This week", value: "this_week" },
  { label: "Custom time", value: "custom" },
];

const CustomStatusModal = ({
  currentUserStatus,
}: {
  currentUserStatus: Doc<"usersStatus">;
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const { isPending, mutate } = useUpdateUserStatus();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emoji: currentUserStatus.customStatusEmoji || "",
      status: currentUserStatus.userNote || "",
      expireTime: "dont_clear",
    },
  });

  const onSubmit = (data: FormValues) => {
    const now = Date.now();
    let expireTime: number;

    switch (data.expireTime) {
      case "1_hour":
        expireTime = now + HOUR_IN_MS;
        break;
      case "4_hours":
        expireTime = now + 4 * HOUR_IN_MS;
        break;
      case "today":
        expireTime = new Date().setHours(23, 59, 59, 999);
        break;
      case "this_week":
        expireTime = now + WEEK_IN_MS;
        break;
      case "custom":
        expireTime = customDate ? customDate.getTime() : now + HOUR_IN_MS;
        break;
      default:
        expireTime = 0;
    }

    mutate(
      {
        customStatusEmoji: data.emoji,
        userNote: data.status,
        expiresAt: expireTime === 0 ? null : expireTime,
      },
      {
        onSuccess: () => {
          toast.success("Update user status is successful");
        },
        onError: () => {
          toast.error("Failed to update user status");
        },
      }
    );
  };

  const currentExpireTime = form.watch("expireTime");
  const showCustomDatePicker = currentExpireTime === "custom";

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const now = new Date();
      date.setHours(now.getHours(), now.getMinutes());
      setCustomDate(date);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!customDate) return;

    const [hours, minutes] = e.target.value.split(":");
    const newDate = new Date(customDate);
    newDate.setHours(parseInt(hours), parseInt(minutes));
    setCustomDate(newDate);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="border group cursor-pointer p-2 rounded-md flex items-center space-x-2 hover:bg-accent">
          <SmileIcon className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">Set a status</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set a custom status</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    disabled={isPending}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10"
                    type="button"
                  >
                    {form.watch("emoji") || <SmileIcon className="h-4 w-4" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => {
                      form.setValue("emoji", emoji.native);
                      setShowEmojiPicker(false);
                    }}
                    theme="light"
                  />
                </PopoverContent>
              </Popover>
              <FormField
                control={form.control}
                name="status"
                disabled={isPending}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="What's happening?"
                        {...field}
                        className="flex-1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              disabled={isPending}
              name="expireTime"
              render={({ field }) => (
                <FormItem>
                  <Select
                    disabled={isPending}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value !== "custom") {
                        setCustomDate(undefined);
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <Clock3 className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Clear status after..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getExpirationOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCustomDatePicker && (
              <div className="flex flex-col">
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !customDate && "text-muted-foreground"
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDate
                        ? format(customDate, "PPP HH:mm")
                        : "Pick a date and time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        onChange={handleTimeChange}
                        value={customDate ? format(customDate, "HH:mm") : ""}
                        className="w-full"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  form.reset();
                  setCustomDate(undefined);
                }}
                disabled={isPending}
              >
                Clear Status
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomStatusModal;
