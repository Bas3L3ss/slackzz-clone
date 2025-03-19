"use client";
import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { SignInFlow } from "../type";
import SignInCard from "./sign-in-card";
import SignUpCard from "./sign-up-card";

function AuthScreen() {
  const [state, setState] = useState<SignInFlow>("signIn");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4A154B] to-[#3B1048]">
      <div className="w-full max-w-[480px] px-4">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-3 rounded-xl shadow-lg mb-6">
            <Building2 className="h-10 w-10 text-[#4A154B]" />
          </div>
          <h1 className="text-white text-3xl font-bold tracking-tight">
            Sign in to Slackzz{" "}
            <span className="text-muted-foreground text-sm">( clone )</span>
          </h1>
          <p className="text-[#E8E1E8] mt-2 text-center">
            We suggest using the email address you use at work.
          </p>
        </div>

        <div className="w-full transform transition-all">
          {state === "signIn" ? (
            <SignInCard setState={setState} />
          ) : (
            <SignUpCard setState={setState} />
          )}
        </div>

        <footer className="mt-8 text-center text-[#E8E1E8] text-sm">
          <p>
            By continuing, you&apos;re agreeing to our Terms of Service,
            <br />
            Privacy Policy, and Cookie Policy.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default AuthScreen;
