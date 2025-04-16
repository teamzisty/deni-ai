import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { authAdmin, notAvailable } from "@repo/firebase-config/server";
import { DecodedIdToken } from "firebase-admin/auth";

const f = createUploadthing();

export class AuthAdminError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AuthAdminError";
  }
}

async function auth(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new UploadThingError("No authorization header");
  if (notAvailable || !authAdmin)
    throw new UploadThingError("Auth not available");
  try {
    const verifiedId = await authAdmin.verifyIdToken(authHeader);
    return verifiedId;
  } catch (e: unknown) {
    if (e instanceof AuthAdminError == false) {
      throw new UploadThingError("Something went wrong");
    }

    if (e instanceof AuthAdminError) {
      if (e.code === "auth/id-token-expired") {
        throw new UploadThingError("Token expired");
      } else if (e.code === "auth/id-token-revoked") {
        throw new UploadThingError("Token revoked");
      } else if (e.code === "auth/invalid-id-token") {
        throw new UploadThingError("Token invalid");
      } else {
        throw new UploadThingError("Something went wrong");
      }
    }
  }
}
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
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
        const user = (await auth(req)) as DecodedIdToken;
        return { userId: user.id };
      } catch (e) {
        if (e instanceof UploadThingError) {
          if (e.message.includes("Token")) {
            throw new UploadThingError("Unauthorized");
          } else {
            throw new UploadThingError("Something went wrong");
          }
        } else {
          throw new UploadThingError("Something went wrong");
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
