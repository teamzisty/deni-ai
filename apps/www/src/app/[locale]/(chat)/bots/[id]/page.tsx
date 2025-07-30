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
  BotIcon,
  Save,
  ArrowLeft,
  Verified,
  MessageCircleMore,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Bot, ClientBot } from "@/lib/bot";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useConversations } from "@/hooks/use-conversations";
import { trpc } from "@/trpc/client";

export default function BotPage() {
  const params = useParams();
  const router = useRouter();

  const { data: bot, isLoading: isBotLoading } = trpc.bot.getBot.useQuery({
    id: params.id as string,
  });
  const { mutate: updateBot, isPending: isUpdatingBot } =
    trpc.bot.updateBot.useMutation();
  const { user, isPending } = useAuth();
  const { createConversation, loading: conversationLoading } =
    useConversations();
  const [isConversationCreating, setIsConversationCreating] = useState(false);
  const [editData, setEditData] = useState<
    Partial<
      ClientBot & {
        system_instruction: string;
      }
    >
  >({
    name: "",
    description: "",
    system_instruction: "",
    instructions: [{ content: "" }],
  });

  useEffect(() => {
    if (bot && bot.userId === user?.id) {
      setEditData({
        name: bot.name,
        description: bot.description || "",
        system_instruction: bot.systemInstruction || "",
        instructions: (bot.instructions as { content: string }[]) || [
          { content: "" },
        ],
      });
    }
  }, [bot, user]);

  // todo: after trpc, add save bot
  const saveBot = async () => {
    if (!bot || !user) return;
    if (!editData.name || !editData.description || !editData.system_instruction || !editData.instructions) return;

    updateBot({
      id: bot.id,
      name: editData.name,
      description: editData.description,
      systemInstruction: editData.system_instruction,
      instructions: editData.instructions,
    });

    setEditData(editData);
  };

  const isAuthor = () => {
    return user && bot && bot.userId === user.id;
  };

  const handleCreateBotChat = async () => {
    setIsConversationCreating(true);
    const conversation = await createConversation(bot! as unknown as ClientBot);
    if (conversation) {
      router.push(`/chat/${conversation.id}`);
    }
  };

  if (isPending || isBotLoading || conversationLoading) {
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

  if (!bot) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <BotIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Bot not found</h3>
          <p className="text-muted-foreground mb-4">
            The bot you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/bots")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bots
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-full">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push("/bots")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="w-full h-full flex justify-center items-center">
        <Card className="w-full max-w-2xl mx-auto">
          <Tabs defaultValue="view" className="w-full">
            <TabsList className="w-[95%] mx-auto mb-4">
              <TabsTrigger value="view">View</TabsTrigger>
              {isAuthor() && <TabsTrigger value="edit">Edit</TabsTrigger>}
            </TabsList>

            <TabsContent value="view">
              <CardHeader className="flex flex-col justify-center items-center">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <BotIcon className="w-5 h-5" />
                  {bot.name}
                </CardTitle>
                <CardDescription className="flex flex-col items-center text-center">
                  {bot.userId && (
                    <div className="text-base text-muted-foreground flex items-center gap-1">
                      <span>{bot.userId || "Unknown User"}</span>
                    </div>
                  )}

                  <p className="text-base text-foreground">
                    {bot.description || "No description provided."}
                  </p>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center w-full gap-4 text-sm text-muted-foreground">
                    <div className="flex flex-col items-center h-full justify-between">
                      <p className="text-lg text-foreground">Rai</p>
                      <p className="font-medium">Created by</p>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex flex-col items-center h-full justify-between">
                      <p className="text-lg text-foreground">
                        {new Date(bot.createdAt || "").toLocaleDateString()}
                      </p>
                      <p className="font-medium">Created at</p>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex flex-col items-center justify-between h-full">
                      <p className="text-lg text-foreground">
                        {bot.userId ? "Verified" : "No flags"}
                      </p>
                      <p className="font-medium">User Flags</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={handleCreateBotChat}
                    disabled={!bot || isConversationCreating}
                  >
                    {isConversationCreating ? (
                      <Loader2 className="animate-spin w-4" />
                    ) : (
                      <MessageCircleMore />
                    )}
                    Start Chat
                  </Button>

                  <Button variant="outline" asChild>
                    <Link href="/bots">Return to Bots</Link>
                  </Button>
                </div>

                {bot && Array.isArray(bot.instructions) && (
                  <div>
                    <h3 className="text-lg font-semibold">Instructions</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      A prompt guide to help you interact with this bot.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bot.instructions.map((example, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <p className="text-sm">{example.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            {isAuthor() && (
              <TabsContent value="edit">
                <CardHeader>
                  <CardTitle>Edit Bot</CardTitle>
                  <CardDescription>
                    Update your bot's name and description.
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
                      placeholder="Enter bot name"
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
                      placeholder="Enter bot description"
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-system-instruction">
                      System Instruction
                    </Label>
                    <Textarea
                      id="edit-system-instruction"
                      value={editData.system_instruction || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          system_instruction: e.target.value,
                        })
                      }
                      placeholder="Enter bot system instruction"
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-instructions">Instructions</Label>
                    <div className="space-y-2">
                      {Array.isArray(editData.instructions) &&
                        editData.instructions.length > 0 &&
                        (editData.instructions || []).map(
                          (instruction, index) => (
                            <div key={index} className="flex gap-2">
                              <Textarea
                                value={instruction.content || ""}
                                onChange={(e) => {
                                  const newInstructions = [
                                    ...(editData.instructions || []),
                                  ];
                                  if (!newInstructions[index]) {
                                    newInstructions[index] = { content: "" };
                                  }
                                  newInstructions[index].content =
                                    e.target.value;
                                  setEditData({
                                    ...editData,
                                    instructions: newInstructions,
                                  });
                                }}
                                placeholder={`Instruction ${index + 1}`}
                                rows={2}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newInstructions = (
                                    editData.instructions || []
                                  ).filter((_, i) => i !== index);
                                  setEditData({
                                    ...editData,
                                    instructions: newInstructions,
                                  });
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ),
                        )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditData({
                            ...editData,
                            instructions: [
                              ...(editData.instructions || []),
                              { content: "" },
                            ],
                          });
                        }}
                      >
                        Add Instruction
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={saveBot}
                    disabled={
                      !editData.name?.trim() ||
                      !editData.description?.trim() ||
                      isUpdatingBot
                    }
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdatingBot ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
