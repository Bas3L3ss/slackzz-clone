import { Button } from "@/components/ui/button";
import { User, Mail, PaintbrushIcon as PaintBrush, Bell } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Mail },
    { id: "appearance", label: "Appearance", icon: PaintBrush },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="w-64 bg-secondary p-4">
      <h2 className="mb-4 text-lg font-semibold">Settings</h2>
      <nav className="space-y-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
