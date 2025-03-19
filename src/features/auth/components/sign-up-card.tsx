import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { SignInFlow } from "../type";
import { useState } from "react";
import { AlertTriangle as TriangleAlert } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

interface SignUpCardProps {
  setState: (state: SignInFlow) => void;
}

const SignUpCard = ({ setState }: SignUpCardProps) => {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<boolean>(false);
  const router = useRouter();

  const onCredentialSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password || !confirmedPassword || !name) {
      setError("Please fill all the fields");
      return;
    }
    if (password !== confirmedPassword) {
      setError("Passwords do not match");
      return;
    }
    setPending(true);
    signIn("password", { name, email, password, flow: "signUp" })
      .catch(() => {
        setError("Something went wrong");
      })
      .finally(() => {
        setPending(false);
        router.refresh();
      });
  };

  const onProviderSignUp = (value: "github" | "google") => {
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
            onClick={() => onProviderSignUp("google")}
            variant="outline"
            size="lg"
            className="w-full relative bg-white hover:bg-gray-50 border-gray-300 font-medium h-12"
          >
            <FcGoogle className="size-5 absolute left-4" />
            Continue with Google
          </Button>
          <Button
            disabled={pending}
            onClick={() => onProviderSignUp("github")}
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

        <form onSubmit={onCredentialSignUp} className="space-y-4">
          <div className="space-y-4">
            <Input
              disabled={pending}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              type="text"
              className="h-12 px-4 bg-white border-gray-300"
            />
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
            <Input
              disabled={pending}
              value={confirmedPassword}
              onChange={(e) => setConfirmedPassword(e.target.value)}
              placeholder="Confirm password"
              type="password"
              className="h-12 px-4 bg-white border-gray-300"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#4A154B] hover:bg-[#3B1048] h-12 font-medium"
            disabled={pending}
          >
            Create Account
          </Button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => setState("signIn")}
            className="text-[#4A154B] hover:underline font-medium"
          >
            Sign in instead
          </button>
        </p>
      </CardContent>
    </Card>
  );
};

export default SignUpCard;
