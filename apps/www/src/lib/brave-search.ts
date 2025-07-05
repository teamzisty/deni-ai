import { env } from '@/lib/env';

export interface BraveSearchQuery {
    original: string;
    show_strict_warning: boolean;
    is_navigational: boolean;
    is_news_breaking: boolean;
    spellcheck_off: boolean;
    country: string;
    bad_results: boolean;
    should_fallback: boolean;
    postal_code: string;
    city: string;
    header_country: string;
    more_results_available: boolean;
    state: string;
}

export interface BraveSearchProfile {
    name: string;
    url: string;
    long_name: string;
    img: string;
}

export interface BraveSearchResult {
    title: string;
    url: string;
    is_source_local: boolean;
    is_source_both: boolean;
    description: string;
    page_age?: string;
    profile: BraveSearchProfile;
    language: string;
    family_friendly: boolean;
    type: string;
    subtype: string;
    is_live: boolean;
    meta_url: {
        scheme: string;
        netloc: string;
        hostname: string;
        favicon: string;
        path: string;
    };
    thumbnail?: {
        src: string;
        original: string;
        logo: boolean;
    };
    age?: string;
}

export interface BraveSearchResponse {
    query: BraveSearchQuery;
    web: {
        type: string;
        results: BraveSearchResult[];
        family_friendly: boolean;
    };
    type: string;
}

export class BraveSearchSDK {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.search.brave.com/res/v1';

    constructor() {
        this.apiKey = env.BRAVE_SEARCH_API_KEY;
    }

    async search(query: string, options?: {
        country?: string;
        language?: string;
        count?: number;
        offset?: number;
    }): Promise<BraveSearchResponse> {
        const searchParams = new URLSearchParams({
            q: query,
            ...(options?.country && { country: options.country }),
            ...(options?.language && { lang: options.language }),
            ...(options?.count && { count: options.count.toString() }),
            ...(options?.offset && { offset: options.offset.toString() }),
        });

        const response = await fetch(`${this.baseUrl}/web/search?${searchParams}`, {
            headers: {
                'X-Subscription-Token': this.apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<BraveSearchResponse>;
    }

    async getWebResults(query: string, options?: {
        country?: string;
        language?: string;
        count?: number;
        offset?: number;
    }): Promise<BraveSearchResult[]> {
        const searchResponse = await this.search(query, options);
        return searchResponse.web.results;
    }
}

export const braveSearch = new BraveSearchSDK();