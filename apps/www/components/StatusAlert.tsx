import React from 'react';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@repo/ui/components/alert";
import { AlertCircleIcon, CheckCircleIcon, XCircleIcon, InfoIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface StatusAlertProps {
  type: AlertType;
  title: string;
  description?: string | React.ReactNode;
  show: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * A component for displaying status alerts in the application
 */
export function StatusAlert({ 
  type = 'info', 
  title, 
  description, 
  show, 
  onClose, 
  className 
}: StatusAlertProps) {
  if (!show) return null;
  
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      case 'warning':
        return 'border-yellow-400';
      case 'info':
      default:
        return 'border-blue-400';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertCircleIcon className="h-4 w-4 text-yellow-400" />;
      case 'info':
      default:
        return <InfoIcon className="h-4 w-4 text-blue-400" />;
    }
  };
  
  return (
    <Alert className={cn("my-2 w-full", getTypeStyles(), className)}>
      {getIcon()}
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
} 