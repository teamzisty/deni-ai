import { User } from "@supabase/supabase-js";
import { supabase } from "@workspace/supabase-config/client";

export class SecureFetch {
    user: User | null;
    constructor(user: User | null) {
        this.user = user;
    }
    async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        const headers = new Headers(options.headers);
        const authToken = await this.getAuthToken();
        console.log("Auth Token:", authToken);
        headers.set("Authorization", `Bearer ${authToken}`);
        const response = await fetch(url, {
            ...options,
            headers
        });
        return response;
    }
    async getAuthToken(): Promise<string> {
        if (this.user && supabase) {
            // Get the session to access the access_token
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                throw new Error("Failed to get session");
            }
            return session.access_token;
        }
        throw new Error("User is not authenticated");
    }
    updateUser(user: User) {
        this.user = user;
    }
}