import { User } from "firebase/auth";

export class SecureFetch {
    user: User | null;
    constructor(user: User | null) {
        this.user = user;
    }
    async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        const headers = new Headers(options.headers);
        const idToken = await this.getIdToken();
        console.log("ID Token:", idToken);
        headers.set("Authorization", `Bearer ${idToken}`);
        const response = await fetch(url, {
            ...options,
            headers
        });
        return response;
    }
    async getIdToken(): Promise<string> {
        if (this.user) {
            const idToken = await this.user.getIdToken();
            return idToken;
        }
        throw new Error("User is not authenticated");
    }
    updateUser(user: User) {
        this.user = user;
    }
}