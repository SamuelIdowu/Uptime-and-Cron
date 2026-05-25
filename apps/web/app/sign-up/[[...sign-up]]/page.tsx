import { SignUp } from "@clerk/nextjs";
import { Activity } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-8">
      <div className="flex items-center gap-3">
        <Activity className="size-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">SteadyState</h1>
      </div>
      <SignUp />
    </div>
  );
}
