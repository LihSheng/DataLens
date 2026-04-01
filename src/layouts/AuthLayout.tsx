import { Outlet } from "react-router-dom";
import { Bot } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">RAG Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
