export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface PullRequestData {
  title: string;
  body: string;
  head: string; // branch name
  base: string; // target branch (usually 'main' or 'master')
}

export interface FileChange {
  path: string;
  content: string;
  operation: "create" | "update" | "delete";
}

export class GitHubService {
  private baseURL = "https://api.github.com";

  constructor(private accessToken: string) {}

  async getCurrentUser(): Promise<GitHubUser> {
    const response = await this.makeRequest("/user");
    return response;
  }

  async getUserRepositories(): Promise<GitHubRepository[]> {
    const response = await this.makeRequest(
      "/user/repos?sort=updated&per_page=100",
    );
    return response;
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const response = await this.makeRequest(`/repos/${owner}/${repo}`);
    return response;
  }

  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseBranch: string = "main",
  ): Promise<void> {
    // Get the SHA of the base branch
    const baseBranchData = await this.makeRequest(
      `/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`,
    );
    const baseSha = baseBranchData.object.sha;

    // Create new branch
    await this.makeRequest(`/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    });
  }

  async commitFiles(
    owner: string,
    repo: string,
    branchName: string,
    files: FileChange[],
    commitMessage: string,
  ): Promise<void> {
    // Get the latest commit SHA for the branch
    const branchData = await this.makeRequest(
      `/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
    );
    const latestCommitSha = branchData.object.sha;

    // Get the tree SHA from the latest commit
    const commitData = await this.makeRequest(
      `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
    );
    const baseTreeSha = commitData.tree.sha;

    // Create tree with file changes
    const tree = files.map((file) => ({
      path: file.path,
      mode: "100644",
      type: "blob",
      content: file.operation === "delete" ? null : file.content,
      ...(file.operation === "delete" && { sha: null }),
    }));

    const newTreeData = await this.makeRequest(
      `/repos/${owner}/${repo}/git/trees`,
      {
        method: "POST",
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: tree,
        }),
      },
    );

    // Create new commit
    const newCommitData = await this.makeRequest(
      `/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        body: JSON.stringify({
          message: commitMessage,
          tree: newTreeData.sha,
          parents: [latestCommitSha],
        }),
      },
    );

    // Update branch reference
    await this.makeRequest(
      `/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          sha: newCommitData.sha,
        }),
      },
    );
  }

  async createPullRequest(
    owner: string,
    repo: string,
    pullRequestData: PullRequestData,
  ): Promise<{ number: number; html_url: string }> {
    const response = await this.makeRequest(`/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      body: JSON.stringify(pullRequestData),
    });

    return {
      number: response.number,
      html_url: response.html_url,
    };
  }
  async checkBranchExists(
    owner: string,
    repo: string,
    branchName: string,
  ): Promise<boolean> {
    try {
      await this.makeRequest(
        `/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
      );
      return true; // Branch exists if no error is thrown
    } catch (error: any) {
      // If we get a 404 error, the branch doesn't exist
      if (error.cause?.status === 404) {
        return false;
      }
      throw error;
    }
  }
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `GitHub API Error: ${response.status} - ${errorData.message || response.statusText}`,
        {
          cause: { status: response.status, data: errorData },
        } as any,
      );
    }

    return await response.json();
  }
  // Utility method to extract WebContainer file changes
  static async extractWebContainerFiles(
    chatId: string,
    excludePatterns: string[] = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      ".cache",
    ],
  ): Promise<FileChange[]> {
    try {
      // Import WebContainer utilities dynamically to avoid circular dependencies
      const { getWebContainerInstance, buildFileStructure } = await import(
        "@/components/WebContainer"
      );

      const webContainerInstance = getWebContainerInstance();
      if (!webContainerInstance) {
        throw new Error("WebContainer instance not available");
      }

      const files: FileChange[] = [];

      // Build file structure from WebContainer
      const fileStructure = await buildFileStructure("/", true, new Set(["/"]));
      if (!fileStructure) {
        throw new Error("Failed to build file structure");
      } // Recursively extract files from structure
      const extractFilesFromStructure = async (
        structure: any,
        currentPath: string = "",
      ) => {
        for (const [name, item] of Object.entries(structure)) {
          const fullPath =
            currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;

          // Skip excluded patterns
          if (excludePatterns.some((pattern) => fullPath.includes(pattern))) {
            continue;
          }

          if (item && typeof item === "object" && "type" in item) {
            const fileItem = item as { type: string; children?: any };

            if (fileItem.type === "file") {
              try {
                // Read file content from WebContainer
                const content = await webContainerInstance.fs.readFile(
                  fullPath,
                  "utf-8",
                );
                files.push({
                  path: fullPath.startsWith("/") ? fullPath.slice(1) : fullPath, // Remove leading slash for GitHub
                  content,
                  operation: "update", // Assume all files are updates for now
                });
              } catch (error) {
                console.warn(`Failed to read file ${fullPath}:`, error);
              }
            } else if (fileItem.type === "directory" && fileItem.children) {
              // Recursively process directories
              await extractFilesFromStructure(fileItem.children, fullPath);
            }
          }
        }
      };

      await extractFilesFromStructure(fileStructure);
      return files;
    } catch (error: any) {
      console.error("Error extracting WebContainer files:", error);
      throw new Error(
        `Failed to extract WebContainer files: ${error?.message || "Unknown error"}`,
      );
    }
  }

  static generateBranchName(prefix: string = "webcontainer"): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${randomSuffix}`;
  }

  static generateCommitMessage(fileCount: number): string {
    const timestamp = new Date().toLocaleString();
    return `WebContainer changes: ${fileCount} file${fileCount !== 1 ? "s" : ""} updated (${timestamp})`;
  }

  static generatePullRequestBody(files: FileChange[]): string {
    const fileList = files
      .map((file) => `- ${file.operation}: \`${file.path}\``)
      .join("\n");

    return `## WebContainer Changes

This pull request contains changes made in the WebContainer development environment.

### Modified Files:
${fileList}

### Summary:
- **Total files changed:** ${files.length}
- **Created by:** Deni AI Intellipulse
- **Timestamp:** ${new Date().toLocaleString()}

---
*This pull request was automatically generated from WebContainer changes.*`;
  }
}

export default GitHubService;