"use client";

import { Search, MessageSquare, Zap, Users, Home } from "lucide-react";
import Link from "next/link";
import FAQSection from "./_component/faq-section";
import SupportForm from "./_component/support-form";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#36C5F0] transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#36C5F0] via-[#2EB67D] to-[#ECB22E] py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How can we help?
          </h1>
          <p className="text-xl opacity-90">
            Search our help center or get in touch with our support team
          </p>
          <div className="mt-8 max-w-2xl mx-auto relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full py-4 pl-12 pr-4 rounded-lg bg-white text-gray-800 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#36C5F0] transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="container mx-auto max-w-4xl px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <MessageSquare className="w-6 h-6 text-[#36C5F0]" />,
              title: "Community Forums",
              description: "Get help from the community",
            },
            {
              icon: <Zap className="w-6 h-6 text-[#2EB67D]" />,
              title: "Quick Start Guides",
              description: "Learn the basics quickly",
            },
            {
              icon: <Users className="w-6 h-6 text-[#ECB22E]" />,
              title: "Video Tutorials",
              description: "Watch step-by-step guides",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-12 space-y-12">
        {/* FAQ Section */}
        <FAQSection />

        {/* Support Form */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Still need help?</h2>
            <p className="mt-2 text-gray-600">
              Our support team is just a message away
            </p>
          </div>
          <SupportForm />
        </div>
      </div>
    </div>
  );
}
