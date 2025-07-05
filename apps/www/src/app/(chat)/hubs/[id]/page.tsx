"use client";

import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  FolderOpen,
  Save,
  ArrowLeft,
  Upload,
  FileText,
  Download,
  Trash2,
  MessageCircleMore,
  Loader2,
} from "lucide-react";
import { useSupabase } from "@/context/supabase-context";
import { useParams, useRouter } from "next/navigation";
import { useConversations } from "@/hooks/use-conversations";
import { useHubs } from "@/hooks/use-hubs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";

interface ClientHub {
  id: string;
  name: string;
  description: string;
  files: any[];
  created_by: {
    name: string;
    verified: boolean;
    id: string;
  };
  created_at: number;
}

export default function HubPage() {
  const [hub, setHub] = useState<ClientHub | null>(null);
  const { user, secureFetch, loading } = useSupabase();
  const { createConversation, loading: conversationLoading } = useConversations();
  const { deleteHub } = useHubs();
  const [isLoading, setIsLoading] = useState(true);
  const [isConversationCreating, setIsConversationCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState<Partial<ClientHub>>({
    name: "",
    description: "",
    files: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const params = useParams();

  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    fetchHub();
  }, [loading, user, params.id]);

  useEffect(() => {
    if (hub && hub.created_by.id === user?.id) {
      setEditData({
        name: hub.name,
        description: hub.description,
        files: hub.files || [],
      });
    }
  }, [hub]);

  const fetchHub = async () => {
    try {
      const response = await secureFetch(`/api/hubs/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHub(data.data);
        } else {
          router.push("/hubs");
        }
      } else {
        router.push("/hubs");
      }
    } catch (error) {
      console.error("Failed to fetch hub:", error);
      router.push("/hubs");
    } finally {
      setIsLoading(false);
    }
  };

  const saveHub = async () => {
    if (!hub) return;

    setIsSaving(true);
    try {
      const response = await secureFetch(`/api/hubs/${hub.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedHub = await response.json();
        if (updatedHub.success) {
          setHub((prev) =>
            prev
              ? {
                  ...prev,
                  name: editData.name || prev.name,
                  description: editData.description || prev.description,
                  files: editData.files || prev.files,
                }
              : null,
          );
        }
      }
    } catch (error) {
      console.error("Failed to update hub:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isAuthor = () => {
    return user && hub && hub.created_by.id === user.id;
  };

  const handleCreateHubChat = async () => {
    setIsConversationCreating(true);
    const conversation = await createConversation(undefined, hub?.id);
    if (conversation) {
      router.push(`/chat/${conversation.id}`);
    }
  };

  const handleDeleteHub = async () => {
    if (!hub) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteHub(hub.id);
      if (success) {
        router.push("/hubs");
      }
    } catch (error) {
      console.error("Failed to delete hub:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || loading || conversationLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Hub not found</h3>
          <p className="text-muted-foreground mb-4">
            The hub you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/hubs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hubs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-full">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push("/hubs")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="w-full h-full flex justify-center items-center">
        <Card className="w-full max-w-4xl mx-auto">
          <Tabs defaultValue="view" className="w-full">
            <TabsList className="w-[95%] mx-auto mb-4">
              <TabsTrigger value="view">View</TabsTrigger>
              {isAuthor() && <TabsTrigger value="edit">Edit</TabsTrigger>}
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="view">
              <CardHeader className="flex flex-col justify-center items-center">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <FolderOpen className="w-5 h-5" />
                  {hub.name}
                </CardTitle>
                <CardDescription className="flex flex-col items-center text-center">
                  {hub.created_by && (
                    <div className="text-base text-muted-foreground flex items-center gap-1">
                      <span>{hub.created_by.name || "Unknown User"}</span>
                    </div>
                  )}

                  <p className="text-base text-foreground">
                    {hub.description || "No description provided."}
                  </p>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center w-full gap-4 text-sm text-muted-foreground">
                    <div className="flex flex-col items-center h-full justify-between">
                      <p className="text-lg text-foreground">{hub.files.length}</p>
                      <p className="font-medium">Files</p>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex flex-col items-center h-full justify-between">
                      <p className="text-lg text-foreground">
                        {new Date(hub.created_at).toLocaleDateString()}
                      </p>
                      <p className="font-medium">Created at</p>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex flex-col items-center justify-between h-full">
                      <p className="text-lg text-foreground">
                        {hub.created_by?.verified ? "Verified" : "No flags"}
                      </p>
                      <p className="font-medium">User Flags</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={handleCreateHubChat}
                    disabled={!hub || isConversationCreating}
                  >
                    {isConversationCreating ? (
                      <Loader2 className="animate-spin w-4" />
                    ) : (
                      <MessageCircleMore />
                    )}
                    Start Chat with Hub
                  </Button>

                  <Button variant="outline" onClick={() => router.push("/hubs")}>
                    Return to Hubs
                  </Button>
                </div>
              </CardContent>
            </TabsContent>

            {isAuthor() && (
              <TabsContent value="edit">
                <CardHeader>
                  <CardTitle>Edit Hub</CardTitle>
                  <CardDescription>
                    Update your hub's name and description.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editData.name || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      placeholder="Enter hub name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editData.description || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter hub description"
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Button
                      onClick={saveHub}
                      disabled={
                        !editData.name?.trim() ||
                        !editData.description?.trim() ||
                        isSaving
                      }
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isDeleting ? "Deleting..." : "Delete Hub"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Hub</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this hub? This action cannot be undone.
                            All conversations associated with this hub will be removed from the hub.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteHub}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </TabsContent>
            )}

            <TabsContent value="files">
              <CardHeader>
                <CardTitle>Files</CardTitle>
                <CardDescription>
                  Manage files in this hub for AI conversations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 mt-4">
                {isAuthor() && (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop files here, or click to browse
                    </p>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                )}

                {hub.files.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No files uploaded yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hub.files.map((file, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name || `File ${index + 1}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                            {isAuthor() && (
                              <Button size="sm" variant="ghost">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}