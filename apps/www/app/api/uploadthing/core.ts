import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import {
  createSupabaseServiceRoleClient,
  notAvailable,
} from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";

const f = createUploadthing();

async function auth(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new UploadThingError("No authorization header");
  if (notAvailable()) {
    throw new UploadThingError("Auth not available");
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const supabase = await createSupabaseServiceRoleClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UploadThingError("Invalid token");
    }

    return user;
  } catch (e: unknown) {
    if (e instanceof UploadThingError) {
      throw e;
    }
    throw new UploadThingError("Something went wrong: " + String(e));
  }
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter: FileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      try {
        const user = (await auth(req)) as User;
        return { userId: user.id };
      } catch (e) {
        if (e instanceof UploadThingError) {
          if (
            e.message.includes("Token") ||
            e.message.includes("Invalid") ||
            e.message.includes("authorization")
          ) {
            throw new UploadThingError("Unauthorized");
          } else {
            throw new UploadThingError("Something went wrong: " + String(e));
          }
        } else {
          throw new UploadThingError("Something went wrong: " + String(e));
        }
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
    })
    .onUploadComplete(async ({ metadata }) => {
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
