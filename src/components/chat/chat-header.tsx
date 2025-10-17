"use client";

import { useAppContext } from "@/contexts/app";
import SignIn from "@/components/sign/sign_in";
import SignUser from "@/components/sign/user";
import { isAuthEnabled } from "@/lib/auth";

export function ChatHeader() {
  const { user } = useAppContext();

  return (
    <div className="px-6 py-4 flex items-center justify-between bg-background">
      <h1 className="text-lg font-semibold">Narra Agent</h1>

      {isAuthEnabled() && (
        <div className="flex items-center gap-2">
          {user ? <SignUser user={user} /> : <SignIn />}
        </div>
      )}
    </div>
  );
}
