import { User, AuthError, Session } from "@supabase/supabase-js";
import { supabase } from "@workspace/supabase-config/client";

export interface GitHubOAuthResult {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export class GitHubOAuthService {
  private authStateListeners: Array<
    (user: User | null, accessToken?: string) => void
  > = [];
  private redirectResultChecked: boolean = false;

  constructor() {
    if (supabase) {
      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user || null;
        let accessToken: string | undefined;

        if (user && session) {
          // Get provider token for GitHub
          accessToken =
            session.provider_token || this.getStoredAccessToken() || undefined;
        }

        this.notifyAuthStateChange(user, accessToken);
      });

      this.checkRedirectResult();
    }
  }

  private async checkRedirectResult(): Promise<void> {
    if (this.redirectResultChecked) return;
    this.redirectResultChecked = true;

    try {
      const result = await this.getRedirectResult();
      if (result) {
        console.log("Redirect result:", result);
      }
    } catch (error) {
      console.error("Error checking redirect result:", error);
      this.clearStoredAccessToken();
    }
  }

  private async isAccessTokenValid(token: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error("Error validating GitHub token:", error);
      return false;
    }
  }

  async signInWithGitHubOptimized(): Promise<GitHubOAuthResult> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return this.signInWithGitHub();
    }

    // Check if user is already linked to GitHub
    const githubProvider =
      session.user.app_metadata.provider === "github" ||
      session.user.app_metadata.providers?.includes("github");

    if (githubProvider) {
      const storedToken = this.getStoredAccessToken();
      if (storedToken) {
        const isValid = await this.isAccessTokenValid(storedToken);
        if (isValid) {
          return {
            user: session.user,
            accessToken: storedToken,
            refreshToken: undefined,
          };
        } else {
          this.clearStoredAccessToken();
        }
      }
    }

    return this.signInWithGitHub();
  }

  async signInWithGitHub(): Promise<GitHubOAuthResult> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("User must be authenticated to link GitHub");
    }

    try {
      const storedToken = this.getStoredAccessToken();
      if (storedToken) {
        const isValid = await this.isAccessTokenValid(storedToken);
        if (isValid) {
          return {
            user: session.user,
            accessToken: storedToken,
            refreshToken: undefined,
          };
        } else {
          this.clearStoredAccessToken();
        }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          scopes: "user repo",
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      return {
        user: session.user,
        accessToken: session.provider_token || "",
        refreshToken: session.refresh_token,
      };
    } catch (error) {
      this.handleAuthError(error as AuthError);
      throw error;
    }
  }

  async signInWithGitHubSafe(): Promise<GitHubOAuthResult> {
    return this.signInWithGitHubOptimized();
  }

  async signInWithGitHubPopup(): Promise<GitHubOAuthResult | null | undefined> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    try {
      // const storedToken = this.getStoredAccessToken();
      // if (storedToken) {
      //   const isValid = await this.isAccessTokenValid(storedToken);
      //   if (isValid) {
      //     return {
      //       user: session.user,
      //       accessToken: storedToken,
      //       refreshToken: undefined,
      //     };
      //   } else {
      //     this.clearStoredAccessToken();
      //   }
      // }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          scopes: "user repo",
          skipBrowserRedirect: true,
          queryParams: { prompt: "consent" },
        },
      });

      if (data?.url && supabase) {
        const popup = window.open(
          data.url,
          "github-oauth",
          "width=600,height=700,scrollbars=yes,resizable=yes"
        );

        // Wait for popup to close
        return new Promise((resolve, reject) => {
          const checkClosed = setInterval(async () => {
            if (popup?.closed && supabase) {
              clearInterval(checkClosed);
              // Check for session after popup closes
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData.session) {
                resolve({
                  user: sessionData.session.user,
                  accessToken: sessionData.session.provider_token || "",
                  refreshToken: sessionData.session.refresh_token,
                });
              } else {
                reject(new Error("Authentication was cancelled or failed"));
              }
            }
          }, 100);
        });
      }
    } catch (error) {
      this.handleAuthError(error as AuthError);
      throw error;
    }
  }

  async signInWithGitHubRedirect(): Promise<void> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("User must be authenticated to link GitHub");
    }

    try {
      const githubProvider =
        session.user.app_metadata.provider === "github" ||
        session.user.app_metadata.providers?.includes("github");

      if (githubProvider) {
        await this.signInWithGitHub();
      } else {
        // Use OAuth to link GitHub account
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            scopes: "user repo",
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      this.handleAuthError(error as AuthError);
      throw error;
    }
  }

  async getRedirectResult(): Promise<GitHubOAuthResult | null> {
    if (!supabase) {
      return null;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return null;
      }

      const accessToken = session.provider_token;
      if (!accessToken) {
        return null;
      }

      this.storeAccessToken(accessToken);

      return {
        user: session.user,
        accessToken: accessToken,
        refreshToken: undefined,
      };
    } catch (error) {
      this.handleAuthError(error as AuthError);
      return null;
    }
  }

  async signOut(): Promise<void> {
    if (!supabase) {
      return;
    }

    try {
      await supabase.auth.signOut();
      this.clearStoredAccessToken();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  getCurrentUser(): User | null {
    // This should be used with auth context instead
    return null;
  }

  isGitHubLinked(): boolean {
    // This is async in Supabase, should use auth context
    return false;
  }

  getGitHubProviderData(): any | null {
    // This should be used with auth context instead
    return null;
  }

  onAuthStateChange(
    callback: (user: User | null, accessToken?: string) => void
  ): () => void {
    this.authStateListeners.push(callback);

    // Call immediately with current user
    const currentUser = this.getCurrentUser();
    callback(currentUser);

    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  async isCurrentTokenValid(): Promise<boolean> {
    const token = this.getStoredAccessToken();
    if (!token) return false;

    return this.isAccessTokenValid(token);
  }

  async isGitHubFullyLinked(): Promise<boolean> {
    return this.isGitHubLinked() && (await this.isCurrentTokenValid());
  }

  getStoredAccessToken(): string | null {
    try {
      return (
        sessionStorage.getItem("github_access_token") ||
        localStorage.getItem("github_access_token")
      );
    } catch (error) {
      console.error("Error getting stored token:", error);
      return null;
    }
  }

  storeAccessToken(token: string, persistent: boolean = false): void {
    try {
      if (persistent) {
        localStorage.setItem("github_access_token", token);
      } else {
        sessionStorage.setItem("github_access_token", token);
      }
    } catch (error) {
      console.error("Error storing token:", error);
    }
  }

  clearStoredAccessToken(): void {
    try {
      sessionStorage.removeItem("github_access_token");
      localStorage.removeItem("github_access_token");
    } catch (error) {
      console.error("Error clearing stored token:", error);
    }
  }

  private notifyAuthStateChange(user: User | null, accessToken?: string): void {
    this.authStateListeners.forEach((callback) => {
      try {
        callback(user, accessToken);
      } catch (error) {
        console.error("Error in auth state callback:", error);
      }
    });
  }

  private handleAuthError(error: AuthError): void {
    console.error("GitHub OAuth Error:", error);

    switch (error.message) {
      case "popup_closed_by_user":
        throw new Error(
          "GitHub Authentication popup was closed before completion. Please try again."
        );
      case "popup_blocked":
        throw new Error(
          "Popup blocked by browser. Please allow popups for this site and try again."
        );
      case "network_error":
        throw new Error(
          "Network error occurred during GitHub authentication. Please check your connection and try again."
        );
      default:
        throw new Error(`GitHub Authentication Error: ${error.message}`);
    }
  }
}

// Export singleton instance
export const githubOAuth = new GitHubOAuthService();
