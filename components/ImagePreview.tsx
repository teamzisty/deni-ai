import { Button } from "@/components/ui/button";
import { Loader2, XIcon } from "lucide-react";
import Image from "next/image";
import { Loading } from "./loading";
import { memo } from "react";

interface ImagePreviewProps {
  image: string | null;
  isUploading: boolean;
  setImage: (image: string | null) => void;
}

export const ImagePreview = memo(
  ({ image, isUploading, setImage }: ImagePreviewProps) => {
    if (!isUploading && !image) return null;

    return (
      <div className="flex mb-2 rounded border gap-2 h-[200px] w-[300px] w-fit p-1">
        {image && (
          <>
            <Image
              src={image}
              width="300"
              height="200"
              alt="Uploaded Image"
              className="object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setImage(null)}
            >
              <XIcon />
            </Button>
          </>
        )}
        {isUploading && <Loader2 className="animate-spin my-auto" size={64} />}
      </div>
    );
  }
);

ImagePreview.displayName = "ImagePreview";
