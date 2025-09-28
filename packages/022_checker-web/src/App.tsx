import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Search, User, Twitter, MessageCircle, Send, Globe, Loader2 } from "lucide-react";

interface VerificationResult {
  platform: string;
  icon: React.ComponentType<any>;
  verified: boolean;
  verifiedAt?: string;
  username?: string;
  profileUrl?: string;
  loading?: boolean;
  error?: string;
}

interface ApiResponse {
  verified: boolean;
  verifiedAt?: string;
}

export default function App() {
  const [username, setUsername] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VerificationResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const platforms = [
    {
      name: "X (Twitter)",
      icon: Twitter,
      endpoint: "/social/check/x",
      getProfileUrl: (username: string) => `https://x.com/${username.replace(/^@/, '')}`
    },
    {
      name: "Farcaster",
      icon: MessageCircle,
      endpoint: "/social/check/farcaster",
      getProfileUrl: (username: string) => `https://warpcast.com/${username.replace(/^@/, '')}`
    },
    {
      name: "Telegram",
      icon: Send,
      endpoint: "/social/check/telegram",
      getProfileUrl: (username: string) => `https://t.me/${username.replace(/^@/, '')}`
    },
    {
      name: "Facebook",
      icon: Globe,
      endpoint: "/social/check/facebook",
      getProfileUrl: (username: string) => `https://facebook.com/${username}`
    }
  ];

  const checkPlatform = async (platform: typeof platforms[0], username: string): Promise<VerificationResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}${platform.endpoint}?username=${encodeURIComponent(username)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      return {
        platform: platform.name,
        icon: platform.icon,
        verified: data.verified,
        verifiedAt: data.verifiedAt,
        username: data.verified ? username : undefined,
        profileUrl: data.verified ? platform.getProfileUrl(username) : undefined,
        loading: false
      };
    } catch (error) {
      console.error(`Error checking ${platform.name}:`, error);
      return {
        platform: platform.name,
        icon: platform.icon,
        verified: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const handleSearch = async () => {
    if (!username.trim()) return;

    setIsSearching(true);
    setHasSearched(false);

    const initialResults: VerificationResult[] = platforms.map(platform => ({
      platform: platform.name,
      icon: platform.icon,
      verified: false,
      loading: true
    }));

    setSearchResults(initialResults);
    setHasSearched(true);

    try {
      const results = await Promise.all(
        platforms.map(platform => checkPlatform(platform, username.trim()))
      );

      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const verifiedCount = searchResults.filter(result => result.verified && !result.loading).length;
  const totalPlatforms = searchResults.filter(result => !result.loading).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Humanpass Checker</h1>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              Human Verification
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Hero Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Username Verification Checker</CardTitle>
            <CardDescription className="text-base">
              Check where your username is verified as human across different social platforms.
              Verify your authentic presence in the digital world.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Check Username
            </CardTitle>
            <CardDescription>
              Enter a username to check its human verification status across platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter username (e.g., johndoe, alice, bob)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-base"
                  disabled={isSearching}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!username.trim() || isSearching}
                size="lg"
                className="sm:w-auto w-full"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Check
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Enter any username to check verification status across social platforms</p>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {hasSearched && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Verification Results for "{username}"
                  </CardTitle>
                  <CardDescription>
                    Human verification status across social platforms
                  </CardDescription>
                </div>
                <Badge variant={verifiedCount > 0 ? "default" : "secondary"} className="w-fit">
                  {verifiedCount}/{totalPlatforms} Verified
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary */}
              <div className={`p-4 rounded-lg border mb-6 ${
                verifiedCount > 0
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
              }`}>
                <div className="flex items-start gap-3">
                  {verifiedCount > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      verifiedCount > 0 ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"
                    }`}>
                      {verifiedCount > 0
                        ? `Human verified on ${verifiedCount} platform${verifiedCount !== 1 ? 's' : ''}`
                        : "No human verification found"
                      }
                    </h4>
                    <p className={`text-sm mt-1 ${
                      verifiedCount > 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                    }`}>
                      {verifiedCount > 0
                        ? "This username has verified human presence on multiple platforms"
                        : "This username has not been verified as human on any tracked platforms"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Platform Results */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {searchResults.map((result, index) => {
                  const IconComponent = result.icon;
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border transition-colors ${
                        result.loading
                          ? "bg-muted/30 border-muted"
                          : result.error
                          ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                          : result.verified
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-muted/50 border-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                            result.loading
                              ? "bg-muted"
                              : result.error
                              ? "bg-red-100 dark:bg-red-900"
                              : result.verified
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-muted"
                          }`}>
                            {result.loading ? (
                              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                            ) : (
                              <IconComponent className={`h-4 w-4 ${
                                result.error
                                  ? "text-red-600 dark:text-red-400"
                                  : result.verified
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-muted-foreground"
                              }`} />
                            )}
                          </div>
                          <span className="font-medium">{result.platform}</span>
                        </div>
                        {result.loading ? (
                          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        ) : result.error ? (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : result.verified ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="text-sm">
                        {result.loading ? (
                          <p className="text-muted-foreground">Checking verification status...</p>
                        ) : result.error ? (
                          <div className="space-y-1">
                            <p className="text-red-700 dark:text-red-300 font-medium">
                              Error checking verification
                            </p>
                            <p className="text-red-600 dark:text-red-400 text-xs">
                              {result.error}
                            </p>
                          </div>
                        ) : result.verified ? (
                          <div className="space-y-1">
                            <p className="text-green-700 dark:text-green-300 font-medium">
                              ✓ Verified as Human
                            </p>
                            {result.verifiedAt && (
                              <p className="text-muted-foreground text-xs">
                                Verified: {new Date(result.verifiedAt).toLocaleDateString()}
                              </p>
                            )}
                            {result.username && (
                              <p className="text-muted-foreground">
                                Username: {result.username}
                              </p>
                            )}
                            {result.profileUrl && (
                              <a
                                href={result.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                View Profile
                                <Globe className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Not verified as human
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-muted-foreground text-sm">
            © 2024 Humanpass - Verifying authentic human presence across social platforms
          </p>
        </div>
      </footer>
    </div>
  );
}
