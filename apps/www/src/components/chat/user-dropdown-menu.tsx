"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Progress } from "@workspace/ui/components/progress";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useSupabase } from "@/context/supabase-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { models, PREMIUM_USES_LIMIT } from "@/lib/constants";

export function UserDropdownMenu() {
  const { supabase, user, usage, ssUserData, loading } = useSupabase();
  const router = useRouter();

  const getInitials = (name: string) => {
    if (!name) return "U"; // Fallback if no name is provided
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out. Please try again.");
    } else {
      router.push("/auth/login");
    }
  };

  if (loading) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="fixed top-4 right-4 h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.user_metadata.avatar_url}
              alt={user?.user_metadata.full_name}
            />
            <AvatarFallback>
              {getInitials(user?.user_metadata.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.user_metadata.full_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {usage && (
          <>
            <DropdownMenuLabel>Usage</DropdownMenuLabel>
            <div className="p-2 text-sm pt-0">
              <div className="flex flex-col space-y-2 w-full">
                <span className="text-muted-foreground">
                  Your Plan:{" "}
                  {ssUserData?.plan != "free" ? (
                    <span className="bg-gradient-to-r from-pink-400 to-sky-500 bg-clip-text text-transparent capitalize">
                      {ssUserData?.plan}
                    </span>
                  ) : (
                    <span>Free</span>
                  )}
                </span>
                {usage
                  .filter((u) => u.premium)
                  .map((u) => (
                    <div key={u.model} className="space-y-1 w-full">
                      <div className="flex justify-between text-xs">
                        <span>{models[u.model]?.name}</span>
                        <span>{u.count} uses</span>
                      </div>
                      <Progress value={u.count} max={PREMIUM_USES_LIMIT} />
                    </div>
                  ))}
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
