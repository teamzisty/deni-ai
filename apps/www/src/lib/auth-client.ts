import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
export const { signIn, signUp, useSession, requestPasswordReset, resetPassword, signOut, updateUser, deleteUser } = authClient;