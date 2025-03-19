import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { AlertTriangle as TriangleAlert } from "lucide-react";
import { SignInFlow } from "../type";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

interface SignInCardProps {
  setState: (state: SignInFlow) => void;
}

const SignInCard = ({ setState }: SignInCardProps) => {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<boolean>(false);
  const router = useRouter();

  const onCredentialSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    signIn("password", { email, password, flow: "signIn" })
      .catch(() => {
        setError("Invalid Email or password");
      })
      .finally(() => {
        setPending(false);
        router.refresh();
      });
  };

  const onProviderSignIn = (value: "github" | "google") => {
    setPending(true);
    signIn(value).finally(() => {
      setPending(false);
    });
  };

  return (
    <Card className="w-full bg-white shadow-xl border-0">
      <CardHeader className="space-y-0 pb-4">
        {error && (
          <div className="bg-red-50 p-4 rounded-md flex items-center gap-x-2 text-red-600 text-sm">
            <TriangleAlert className="size-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button
            disabled={pending}
            onClick={() => onProviderSignIn("google")}
            variant="outline"
            size="lg"
            className="w-full relative bg-white hover:bg-gray-50 border-gray-300 font-medium h-12"
          >
            <FcGoogle className="size-5 absolute left-4" />
            Continue with Google
          </Button>
          <Button
            disabled={pending}
            onClick={() => onProviderSignIn("github")}
            variant="outline"
            size="lg"
            className="w-full relative bg-white hover:bg-gray-50 border-gray-300 font-medium h-12"
          >
            <FaGithub className="size-5 absolute left-4" />
            Continue with GitHub
          </Button>
        </div>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
            OR
          </span>
        </div>

        <form onSubmit={onCredentialSignIn} className="space-y-4">
          <div className="space-y-4">
            <Input
              disabled={pending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@work-email.com"
              type="email"
              className="h-12 px-4 bg-white border-gray-300"
            />
            <Input
              disabled={pending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="h-12 px-4 bg-white border-gray-300"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#4A154B] hover:bg-[#3B1048] h-12 font-medium"
            disabled={pending}
          >
            Sign In with Email
          </Button>
        </form>

        <p className="text-sm text-center text-gray-600">
          New to Workspace?{" "}
          <button
            onClick={() => setState("signUp")}
            className="text-[#4A154B] hover:underline font-medium"
          >
            Create an account
          </button>
        </p>
      </CardContent>
    </Card>
  );
};

export default SignInCard;
