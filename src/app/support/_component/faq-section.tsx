"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageSquare, Zap, Shield, Laptop, Users, Lock } from "lucide-react";

const faqs = [
  {
    question: "How do I reset my workspace password?",
    answer:
      "You can reset your password by clicking the 'Forgot Password' link on the login page. We'll send you an email with instructions to create a new password.",
    icon: <Lock className="w-5 h-5 text-[#36C5F0]" />,
  },
  {
    question: "Can I use keyboard shortcuts?",
    answer:
      "Yes! Press ⌘/Ctrl + / to view all available keyboard shortcuts. Some popular ones include ⌘/Ctrl + K for quick navigation and ⌘/Ctrl + B to toggle the sidebar.",
    icon: <Zap className="w-5 h-5 text-[#2EB67D]" />,
  },
  {
    question: "How do I manage channel notifications?",
    answer:
      "Click the channel name at the top of your screen, then select 'Notification preferences'. You can choose between all messages, mentions only, or nothing.",
    icon: <MessageSquare className="w-5 h-5 text-[#E01E5A]" />,
  },
  {
    question: "What devices can I use to access my workspace?",
    answer:
      "You can access your workspace through our web app, desktop apps (Windows, Mac, Linux), and mobile apps (iOS, Android). All apps sync automatically.",
    icon: <Laptop className="w-5 h-5 text-[#ECB22E]" />,
  },
  {
    question: "How do I invite new team members?",
    answer:
      "Workspace admins can invite new members by clicking the workspace name, selecting 'Invite people', and entering their email addresses.",
    icon: <Users className="w-5 h-5 text-[#36C5F0]" />,
  },
  {
    question: "What security features are available?",
    answer:
      "We offer 2FA, SSO, domain claiming, and enterprise-grade security features. Visit our security settings to enable these features.",
    icon: <Shield className="w-5 h-5 text-[#2EB67D]" />,
  },
];

export default function FAQSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border rounded-lg px-4 hover:bg-gray-50 transition-colors"
          >
            <AccordionTrigger className="flex gap-3 py-4 text-left">
              <span className="flex items-center gap-3">
                {faq.icon}
                <span className="font-semibold">{faq.question}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 pl-8">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
