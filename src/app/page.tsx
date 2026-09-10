import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { HOME_DESCRIPTION, HOME_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
};

export default function RootPage() {
  permanentRedirect("/home");
}
