import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Github, ExternalLink } from "lucide-react";
import { BRAND_NAME, GITHUB_URL } from "@/lib/constants";

interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

interface GitHubUser {
  name: string | null;
  bio: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  type: string;
}

interface Contributor extends GitHubContributor {
  userDetails?: GitHubUser;
}

async function getContributors(): Promise<Contributor[]> {
  try {
    // Replace with your actual repository
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_URL.split("github.com/")[1]}/contributors`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // Add GitHub token for higher rate limits (optional)
          // 'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        },
        next: { revalidate: 3600 }, // Revalidate every hour
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch contributors");
    }

    const contributors: GitHubContributor[] = await response.json();

    // Filter out bots and known bot patterns
    const humanContributors = contributors.filter((contributor) => {
      const login = contributor.login.toLowerCase();
      return (
        contributor.type !== "Bot" &&
        !login.includes("bot") &&
        !login.includes("[bot]") &&
        !login.endsWith("-bot") &&
        !login.startsWith("bot-") &&
        login !== "dependabot" &&
        login !== "renovate" &&
        login !== "greenkeeper"
      );
    });

    // Fetch detailed user information for each contributor
    const contributorsWithDetails = await Promise.all(
      humanContributors.slice(0, 12).map(async (contributor) => {
        // Limit to first 12
        try {
          const userResponse = await fetch(
            `https://api.github.com/users/${contributor.login}`,
            {
              headers: {
                Accept: "application/vnd.github.v3+json",
              },
              next: { revalidate: 3600 },
            },
          );

          if (userResponse.ok) {
            const userDetails: GitHubUser = await userResponse.json();
            // Double-check that the user is not a bot
            if (userDetails.type === "Bot") {
              return null;
            }
            return { ...contributor, userDetails };
          }
        } catch (error) {
          console.error(
            `Failed to fetch user details for ${contributor.login}:`,
            error,
          );
        }

        return contributor;
      }),
    );

    return contributorsWithDetails.filter(Boolean) as Contributor[];
  } catch (error) {
    console.error("Error fetching contributors:", error);
    return [];
  }
}

function getRoleFromContributions(contributions: number): string {
  if (contributions >= 100) return "Core Maintainer";
  if (contributions >= 50) return "Active Contributor";
  if (contributions >= 20) return "Regular Contributor";
  return "Contributor";
}

export default async function ContributorsPage() {
  const contributors = await getContributors();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contributors</h1>
          <p className="text-xl text-muted-foreground">
            Meet the amazing people who make {BRAND_NAME} possible
          </p>
        </div>

        {contributors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Unable to load contributors at this time.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contributors.map((contributor) => (
              <Card
                key={contributor.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage
                      src={contributor.avatar_url}
                      alt={contributor.userDetails?.name || contributor.login}
                    />
                    <AvatarFallback>
                      {contributor.login.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl">
                    {contributor.userDetails?.name || contributor.login}
                  </CardTitle>
                  <CardDescription>@{contributor.login}</CardDescription>
                  <Badge variant="secondary" className="w-fit mx-auto">
                    {getRoleFromContributions(contributor.contributions)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contributor.userDetails?.bio && (
                    <p className="text-sm text-muted-foreground text-center">
                      {contributor.userDetails.bio}
                    </p>
                  )}

                  <div className="text-center">
                    <p className="text-sm font-medium">
                      <span className="text-2xl font-bold text-primary">
                        {contributor.contributions}
                      </span>
                      <br />
                      <span className="text-muted-foreground">
                        Contributions
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={contributor.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Github className="w-4 h-4" />
                        GitHub
                      </a>
                    </Button>
                    {contributor.userDetails?.blog && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={
                            contributor.userDetails.blog.startsWith("http")
                              ? contributor.userDetails.blog
                              : `https://${contributor.userDetails.blog}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Want to Contribute?</h2>
          <p className="text-muted-foreground mb-6">
            We welcome contributions from developers of all skill levels.
          </p>
          <Button asChild>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
