import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Home, LifeBuoy } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#1d1d1d] to-[#2d2d2d] text-white px-4">
      {/* Slack-inspired Header */}
      <div className="relative">
        <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#36C5F0] via-[#2EB67D] to-[#ECB22E]">
          404
        </h1>
        <div className={`absolute -top-6 -right-6  `}>
          <MessageSquare className="w-12 h-12 text-[#E01E5A] transform rotate-12" />
        </div>
      </div>

      {/* Fun Message */}
      <p className="mt-6 text-2xl font-medium text-gray-300 text-center max-w-md">
        Looks like this channel doesn&apos;t exist...
        <span className="block mt-2 text-lg text-gray-400">
          Time to head back to your workspace!
        </span>
      </p>

      {/* Slack-style Illustration */}
      <div className="mt-12 relative">
        <Image
          src="https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&h=600&fit=crop"
          alt="Relaxed workspace"
          width={400}
          height={300}
          className="rounded-lg shadow-2xl opacity-80 hover:opacity-100 transition-opacity duration-300"
        />
        <div className="absolute -bottom-4 -right-4 bg-[#2EB67D] p-3 rounded-full shadow-lg">
          <MessageSquare className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="group flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#36C5F0] rounded-md hover:bg-[#2B99C2] transition-all duration-300 hover:scale-105"
        >
          <Home className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Back to Workspace
        </Link>
        <Link
          href="/support"
          className="group flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#E01E5A] rounded-md hover:bg-[#BC1951] transition-all duration-300 hover:scale-105"
        >
          <LifeBuoy className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Contact Support
        </Link>
      </div>

      {/* Footer Message */}
      <p className="mt-12 text-sm text-gray-500">
        Tip: You can use{" "}
        <kbd className="px-2 py-1 bg-gray-800 rounded-md">⌘/Ctrl + K</kbd> to
        search
      </p>
    </div>
  );
}
