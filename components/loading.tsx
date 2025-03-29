import React from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export const Loading: React.FC = () => {
  return (
    <div className="flex h-screen w-full items-center mx-auto justify-center">
      <Loader2 className="animate-spin" size={128} />
    </div>
  );
};
