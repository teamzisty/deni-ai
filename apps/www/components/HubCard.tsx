import React from 'react';
import { Hub } from '@/types/hub';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { MessageSquare, FileText, Edit3, Users, Settings2 } from 'lucide-react';

interface HubCardProps {
  hub: Hub;
  onViewDetails: (hubId: string) => void;
  // Add other actions like onDelete, onEdit if needed directly on the card
}

export const HubCard: React.FC<HubCardProps> = ({ hub, onViewDetails }) => {
  const t = useTranslations('Hubs');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate" title={hub.name}>{hub.name}</span>
          {/* <Button variant="ghost" size="icon" onClick={() => onViewDetails(hub.id)}><Settings2 size={18} /></Button> */} 
        </CardTitle>
        {hub.description && (
          <CardDescription className="h-10 line-clamp-2" title={hub.description}>
            {hub.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div className="text-sm text-muted-foreground flex items-center">
          <MessageSquare size={14} className="mr-2 flex-shrink-0" />
          <span>{t('chatSessionsCount', { count: hub.chatSessionIds.length })}</span>
        </div>
        <div className="text-sm text-muted-foreground flex items-center">
          <FileText size={14} className="mr-2 flex-shrink-0" />
          <span>{t('filesCount', { count: hub.fileReferences.length })}</span>
        </div>
        {hub.customInstructions && (
          <div className="text-sm text-muted-foreground flex items-start">
            <Edit3 size={14} className="mr-2 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2" title={hub.customInstructions}>{t('customInstructionsSet')}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4 mt-auto">
        <span className="text-xs text-muted-foreground">
          {t('updated', { date: formatDate(hub.updatedAt) })}
        </span>
        <Button variant="outline" size="sm" onClick={() => onViewDetails(hub.id)}>
          {t('viewDetails')}
        </Button>
      </CardFooter>
    </Card>
  );
};

HubCard.displayName = 'HubCard';