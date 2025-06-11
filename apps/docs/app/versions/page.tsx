import Link from "next/link";
import { Calendar, Download, Github, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Version {
  version: string;
  date: string;
  status: "current" | "supported" | "deprecated";
  description: string;
  changelog?: string;
  downloadUrl?: string;
}

const versions: Version[] = [
  {
    version: "1.0.0",
    date: "2024-12-01",
    status: "current",
    description: "Latest stable release with new features and improvements.",
    changelog: "/changelog/v1.0.0",
    downloadUrl: "https://github.com/raicdev/deni-ai/releases/tag/v1.0.0",
  },
  {
    version: "0.9.0",
    date: "2024-11-15",
    status: "supported",
    description: "Previous stable release with bug fixes and enhancements.",
    changelog: "/changelog/v0.9.0",
    downloadUrl: "https://github.com/raicdev/deni-ai/releases/tag/v0.9.0",
  },
  {
    version: "0.8.0",
    date: "2024-10-30",
    status: "deprecated",
    description: "Older release - upgrade recommended.",
    changelog: "/changelog/v0.8.0",
    downloadUrl: "https://github.com/raicdev/deni-ai/releases/tag/v0.8.0",
  },
];

const getStatusColor = (status: Version["status"]) => {
  switch (status) {
    case "current":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "supported":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "deprecated":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

const getStatusText = (status: Version["status"]) => {
  switch (status) {
    case "current":
      return "Current";
    case "supported":
      return "Supported";
    case "deprecated":
      return "Deprecated";
    default:
      return "Unknown";
  }
};

export default function VersionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Versions
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          All released versions of Deni AI with their status and changelog
          information.
        </p>
      </div>

      <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Version Support Policy
        </h2>
        <ul className="text-blue-800 dark:text-blue-200 space-y-1">
          <li>
            <strong>Current:</strong> Latest stable version with active
            development
          </li>
          <li>
            <strong>Supported:</strong> Receives security updates and critical
            bug fixes
          </li>
          <li>
            <strong>Deprecated:</strong> No longer supported, upgrade
            recommended
          </li>
        </ul>
      </div>

      <div className="space-y-6">
        {versions.map((version) => (
          <div
            key={version.version}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    v{version.version}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      version.status,
                    )}`}
                  >
                    {getStatusText(version.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={version.date}>
                    Released {format(new Date(version.date), "MMMM d, yyyy")}
                  </time>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {version.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {version.changelog && (
                <Link
                  href={version.changelog}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                  View Changelog
                </Link>
              )}
              {version.downloadUrl && (
                <Link
                  href={version.downloadUrl}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Link>
              )}
              <Link
                href={`https://github.com/raicdev/deni-ai/releases/tag/v${version.version}`}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                GitHub Release
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="https://github.com/raicdev/deni-ai/releases"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="h-5 w-5" />
          View All Releases on GitHub
        </Link>
      </div>
    </div>
  );
}
