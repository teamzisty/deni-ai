import React, { useState, useEffect, useCallback } from "react";
import { Hub, HubFileReference } from "@/types/hub";
import { useHubs } from "@/hooks/useHubs";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  Save,
  Trash2,
  Paperclip,
  Link2,
} from "lucide-react";
// For now, we'll use useChatSessions to get session titles.
// In a real app, you might fetch this data more efficiently or have it embedded.
import { useChatSessions } from "@/hooks/use-chat-sessions";

interface HubDetailProps {
  hubId: string;
  onClose: () => void;
}

const HubDetail: React.FC<HubDetailProps> = ({ hubId, onClose }) => {
  const {
    getHub,
    updateHub,
    deleteHub,
    addChatSessionToHub,
    removeChatSessionFromHub,
    addFileToHub,
    removeFileFromHub,
  } = useHubs();
  const { sessions: allChatSessions } = useChatSessions(); // To get chat titles
  const t = useTranslations("Hubs");
  const commonT = useTranslations("common");

  const [hub, setHub] = useState<Hub | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  // States for linking items - simplified for now
  const [chatToLink, setChatToLink] = useState("");
  const [fileToLinkName, setFileToLinkName] = useState("");
  const [fileToLinkType, setFileToLinkType] = useState("text/plain"); // Default or detected

  useEffect(() => {
    const currentHub = getHub(hubId);
    if (currentHub) {
      setHub(currentHub);
      setName(currentHub.name);
      setDescription(currentHub.description || "");
      setCustomInstructions(currentHub.customInstructions || "");
    } else {
      onClose(); // Hub not found, close detail view
    }
  }, [hubId, getHub, onClose]);

  const handleSaveChanges = useCallback(() => {
    if (hub) {
      updateHub(hub.id, { name, description, customInstructions });
      // Optionally, provide user feedback (e.g., toast notification)
      alert(t("hubUpdated"));
    }
  }, [hub, name, description, customInstructions, updateHub, t]);

  const handleDeleteHub = useCallback(() => {
    if (hub && confirm(t("confirmDeleteHub", { hubName: hub.name }))) {
      deleteHub(hub.id);
      onClose();
    }
  }, [hub, deleteHub, onClose, t]);

  const handleAddChatSession = useCallback(() => {
    if (hub && chatToLink) {
      // Basic check: ensure session exists (in a real app, this would be more robust)
      const sessionExists = allChatSessions.some((s) => s.id === chatToLink);
      if (sessionExists) {
        addChatSessionToHub(hub.id, chatToLink);
        setHub(getHub(hub.id) || null); // Refresh hub data
        setChatToLink("");
      } else {
        alert(t("chatSessionNotFound"));
      }
    }
  }, [hub, chatToLink, addChatSessionToHub, getHub, allChatSessions, t]);

  const handleRemoveChatSession = useCallback(
    (sessionId: string) => {
      if (hub) {
        removeChatSessionFromHub(hub.id, sessionId);
        setHub(getHub(hub.id) || null); // Refresh hub data
      }
    },
    [hub, removeChatSessionFromHub, getHub],
  );

  const handleAddFile = useCallback(() => {
    if (hub && fileToLinkName.trim()) {
      // In a real app, this would involve file upload logic.
      // Here, we're just adding a reference.
      addFileToHub(hub.id, {
        name: fileToLinkName,
        type: fileToLinkType,
        path: "simulated/path/" + fileToLinkName,
        size: Math.floor(Math.random() * 100000),
      });
      setHub(getHub(hub.id) || null); // Refresh hub data
      setFileToLinkName("");
      setFileToLinkType("text/plain");
    }
  }, [hub, fileToLinkName, fileToLinkType, addFileToHub, getHub]);

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      if (hub) {
        removeFileFromHub(hub.id, fileId);
        setHub(getHub(hub.id) || null); // Refresh hub data
      }
    },
    [hub, removeFileFromHub, getHub],
  );

  if (!hub) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>{t("loadingHub")}</p>
      </div>
    );
  }

  const getChatSessionTitle = (sessionId: string) => {
    const session = allChatSessions.find((s) => s.id === sessionId);
    return session ? session.title : t("unknownChatSession");
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold truncate" title={hub.name}>
          {hub.name}
        </h1>
      </div>

      <div className="flex-grow overflow-y-auto space-y-6 pb-16">
        {" "}
        {/* Added pb-16 for footer spacing */}
        {/* General Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("generalInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="hubName"
                className="block text-sm font-medium mb-1"
              >
                {t("hubNameLabel")}
              </label>
              <Input
                id="hubName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("hubNamePlaceholder")}
              />
            </div>
            <div>
              <label
                htmlFor="hubDescription"
                className="block text-sm font-medium mb-1"
              >
                {t("hubDescriptionLabel")}
              </label>
              <Textarea
                id="hubDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("hubDescriptionPlaceholder")}
                rows={3}
              />
            </div>
            <div>
              <label
                htmlFor="hubInstructions"
                className="block text-sm font-medium mb-1"
              >
                {t("hubCustomInstructionsLabel")}
              </label>
              <Textarea
                id="hubInstructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={t("hubCustomInstructionsPlaceholder")}
                rows={5}
              />
            </div>
          </CardContent>
        </Card>
        {/* Linked Chat Sessions Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("linkedChatSessions")}</CardTitle>
          </CardHeader>
          <CardContent>
            {hub.chatSessionIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noLinkedChats")}
              </p>
            ) : (
              <ul className="space-y-2">
                {hub.chatSessionIds.map((sessionId) => (
                  <li
                    key={sessionId}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <span
                      className="truncate"
                      title={getChatSessionTitle(sessionId)}
                    >
                      <MessageSquare size={16} className="inline mr-2" />
                      {getChatSessionTitle(sessionId)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveChatSession(sessionId)}
                      title={t("unlinkChat")}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-2">
              <Input
                value={chatToLink}
                onChange={(e) => setChatToLink(e.target.value)}
                placeholder={t("chatIdToLinkLabel")}
                list="chat-session-suggestions"
              />
              <datalist id="chat-session-suggestions">
                {allChatSessions
                  .filter((cs) => !hub.chatSessionIds.includes(cs.id))
                  .map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.title}
                    </option>
                  ))}
              </datalist>
              <Button onClick={handleAddChatSession}>
                <Link2 size={16} className="mr-1" /> {t("linkChat")}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Linked Files Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("linkedFiles")}</CardTitle>
          </CardHeader>
          <CardContent>
            {hub.fileReferences.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noLinkedFiles")}
              </p>
            ) : (
              <ul className="space-y-2">
                {hub.fileReferences.map((file) => (
                  <li
                    key={file.id}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <span className="truncate" title={file.name}>
                      <FileText size={16} className="inline mr-2" />
                      {file.name} ({file.type},{" "}
                      {file.size
                        ? (file.size / 1024).toFixed(1) + " KB"
                        : "N/A"}
                      )
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id)}
                      title={t("removeFile")}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">{t("addFileReference")}</p>
              <div className="flex gap-2">
                <Input
                  value={fileToLinkName}
                  onChange={(e) => setFileToLinkName(e.target.value)}
                  placeholder={t("fileNamePlaceholder")}
                />
                <Input
                  value={fileToLinkType}
                  onChange={(e) => setFileToLinkType(e.target.value)}
                  placeholder={t("fileTypePlaceholder")}
                />
                <Button onClick={handleAddFile}>
                  <Paperclip size={16} className="mr-1" /> {t("addFile")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("fileReferenceNote")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end space-x-3 md:relative md:bg-transparent md:border-t-0 md:p-0 md:mt-6">
        <Button variant="destructive" onClick={handleDeleteHub}>
          <Trash2 size={16} className="mr-2" />
          {commonT("delete")}
        </Button>
        <Button onClick={handleSaveChanges}>
          <Save size={16} className="mr-2" />
          {commonT("save")}
        </Button>
      </div>
    </div>
  );
};

export default HubDetail;
