"use client";

import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { User, Key, Shield, ArrowLeft, Book } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { useAuth } from "@/context/AuthContext";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Skeleton } from "@workspace/ui/components/skeleton";
export const SidebarNav = () => {
  const t = useTranslations("account");
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  const items = [
    {
      title: t("sidebarNav.account"),
      href: "/account",
      value: "/account",
      icon: <User className="h-4 w-4 mr-2" />,
    },
    {
      title: t("sidebarNav.password"),
      href: "/account/password",
      value: "/account/password",
      icon: <Key className="h-4 w-4 mr-2" />,
    },
    {
      title: t("sidebarNav.security"),
      href: "/account/security",
      value: "/account/security",
      icon: <Shield className="h-4 w-4 mr-2" />,
    },
  ];

  const bottomItems = [
    {
      title: "Voids API Docs",
      href: "https://voids.top/docs",
      value: "https://voids.top/docs",
      icon: <Book className="h-4 w-4 mr-2" />,
    },
    {
      title: t("layout.return"),
      href: "/home",
      value: "/home",
      icon: <ArrowLeft className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <>
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="w-full flex-grow">
            <div className="flex flex-col space-y-2 w-full h-auto">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </div>
          <div className="w-full mt-auto">
            <div className="flex flex-col space-y-2 w-full h-auto">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {user && (
            <div className="flex items-center gap-4 mb-4">
              {" "}
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                <AvatarFallback>
                  {user.user_metadata?.full_name?.charAt(0) ||
                    user.user_metadata?.display_name?.charAt(0) ||
                    user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p>
                {user.user_metadata?.full_name ||
                  user.user_metadata?.display_name ||
                  user.email}
              </p>
            </div>
          )}
          <Tabs
            defaultValue={pathname}
            className="w-full flex-grow"
            orientation="vertical"
          >
            <TabsList className="flex flex-col bg-transparent space-y-2 w-full h-auto">
              {items.map((item) => (
                <TabsTrigger
                  key={item.href}
                  value={item.value}
                  className="w-full justify-start py-2 px-3 text-md hover:bg-secondary transition-all duration-300"
                  asChild
                >
                  <Link href={item.href} className="flex items-center">
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Tabs
            defaultValue={pathname}
            className="w-full"
            orientation="vertical"
          >
            <TabsList className="flex flex-col bg-transparent space-y-2 w-full h-auto mt-auto">
              {bottomItems.map((item) => (
                <TabsTrigger
                  key={item.href}
                  value={item.value}
                  className="w-full justify-start py-2 px-3 text-md hover:bg-secondary transition-all duration-300"
                  asChild
                >
                  <Link href={item.href} className="flex items-center">
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </>
      )}
    </div>
  );
};
