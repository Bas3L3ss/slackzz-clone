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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function AccountTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage your account settings and security preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Email Address</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input placeholder="your.email@example.com" />
              <Badge variant="secondary">Unverified</Badge>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please verify your email address to access all features.
              </AlertDescription>
            </Alert>
            <Button variant="secondary" size="sm">
              Send Verification Email
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Change Password</Label>
          <div className="space-y-2">
            <Input type="password" placeholder="Current password" />
            <Input type="password" placeholder="New password" />
            <Input type="password" placeholder="Confirm new password" />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Phone Number</Label>
          <Input placeholder="+1 (555) 000-0000" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
