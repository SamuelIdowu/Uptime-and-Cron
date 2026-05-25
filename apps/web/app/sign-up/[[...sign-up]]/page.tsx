import { SignUp } from "@clerk/nextjs";
import { Activity } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-8">
      <div className="flex items-center gap-3">
        <Activity className="size-8 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">SteadyState</h1>
      </div>
      <div className="w-full max-w-[400px]">
        <SignUp 
          appearance={{
            elements: {
              card: "bg-card border border-border shadow-sm rounded-xl p-2",
              headerTitle: "text-foreground font-semibold",
              headerSubtitle: "text-muted-foreground text-sm",
              socialButtonsBlockButton: "bg-background border border-border text-foreground hover:bg-muted rounded-md transition-colors font-medium",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground text-sm font-medium",
              formFieldInput: "bg-background border border-border text-foreground rounded-md focus:ring-1 focus:ring-primary focus:border-primary",
              formButtonPrimary: "bg-primary border border-transparent text-primary-foreground hover:bg-primary/90 rounded-md transition-colors font-medium shadow-sm",
              footerActionText: "text-muted-foreground text-sm",
              footerActionLink: "text-primary text-sm hover:text-primary/80 font-medium",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-primary hover:text-primary/80",
            }
          }} 
        />
      </div>
    </div>
  );
}
