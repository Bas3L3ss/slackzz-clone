"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProfileTab } from "./_component/profile-tab";
import { Sidebar } from "./_component/sidebar";
import { AccountTab } from "./_component/account-tab";
import { NotificationsTab } from "./_component/notifications-tab";
import { AppearanceTab } from "./_component/appearance-tab";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl py-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsContent className="px-10 pb-10 -pt-2" value="profile">
              <ProfileTab />
            </TabsContent>
            <TabsContent className="px-10 pb-10 -pt-2" value="account">
              <AccountTab />
            </TabsContent>
            <TabsContent className="px-10 pb-10 -pt-2" value="appearance">
              <AppearanceTab />
            </TabsContent>
            <TabsContent className="px-10 pb-10 -pt-2" value="notifications">
              <NotificationsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
