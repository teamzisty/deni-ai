"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { useConversations } from "@/hooks/use-conversations";
import { toast } from "sonner";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "KeyB",
  "KeyA",
];

export function HiddenElement() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const { deleteAllConversations } = useConversations();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setSequence((prev) => {
        const newSequence = [...prev, event.code].slice(-KONAMI_CODE.length);

        if (
          newSequence.length === KONAMI_CODE.length &&
          newSequence.every((key, index) => key === KONAMI_CODE[index])
        ) {
          setShowDialog(true);
          return [];
        }

        return newSequence;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClearConversations = async () => {
    toast.promise(deleteAllConversations, {
      loading: "Deleting...",
      success: "Conversations deleted.",
      error: "Failed to delete conversations.",
    });
    setShowDialog(false);
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete all conversations?</AlertDialogTitle>
          <AlertDialogDescription>
            Congrats. You found the Secret! But this is a dangerous action.{" "}
            <br />
            Are you sure you want to delete all conversations? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild onClick={handleClearConversations}>
            <Button variant="destructive">Delete</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
