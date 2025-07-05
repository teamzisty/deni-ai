"use client";

import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Plus, Bot, Edit, Trash2, Eye } from "lucide-react";
import { useSupabase } from "@/context/supabase-context";
import { ClientBot } from "@/lib/bot";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

export default function BotsPage() {
  const [bots, setBots] = useState<ClientBot[]>([]);
  const { user, secureFetch, loading } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBot, setNewBot] = useState({ name: "", description: "" });

  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    fetchBots();
  }, [loading, user]);

  const fetchBots = async () => {
    try {
      const response = await secureFetch("/api/bots");
      if (response.ok) {
        const data = await response.json();
        if (!data.success) return;

        setBots(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch bots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBot = async () => {
    try {
      const response = await secureFetch("/api/bots", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBot),
      });

      if (response.ok) {
        const createdBot = await response.json();
        if (!createdBot.success) return;

        router.push(`/bots/${createdBot.botId}`);
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to create bot:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Bots</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Bot</DialogTitle>
              <DialogDescription>
                Create a new AI bot with a custom name and description.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newBot.name}
                  onChange={(e) =>
                    setNewBot({ ...newBot, name: e.target.value })
                  }
                  placeholder="Enter bot name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newBot.description}
                  onChange={(e) =>
                    setNewBot({ ...newBot, description: e.target.value })
                  }
                  placeholder="Enter bot description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={createBot}
                disabled={!newBot.name.trim() || !newBot.description.trim()}
              >
                Create Bot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading || loading || !bots ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No bots yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first bot.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Bot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <Card key={bot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  {bot.name}
                </CardTitle>
                <CardDescription>{bot.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Created: {new Date(bot.created_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2 mt-auto">
                <Button variant="outline" asChild>
                  <Link href={`/bots/${bot.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
