import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SmilePlus, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function ProfileTab() {
  const [status, setStatus] = useState("online");
  const [customStatusExpiry, setCustomStatusExpiry] = useState<Date>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage your public profile information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder.jpg" alt="Profile" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <Button>Change Avatar</Button>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" placeholder="Your display name" />
          </div>

          <div className="space-y-4">
            <Label>Status</Label>
            <div className="flex items-center space-x-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Custom Status</Label>
            <div className="flex items-center space-x-4">
              <Input placeholder="What's on your mind?" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SmilePlus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>Emoji picker placeholder</PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Clock className="mr-2 h-4 w-4" />
                {customStatusExpiry
                  ? format(customStatusExpiry, "PP")
                  : "Set expiration"}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Clear after...
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStatusExpiry}
                    onSelect={setCustomStatusExpiry}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
