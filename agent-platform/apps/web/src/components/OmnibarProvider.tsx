/**
 * Omnibar Provider
 * Global context provider for the Omnibar component
 */

"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { OmnibarV2 } from '@/components/OmnibarV2';
import { usePlatformStore } from '@/store';

interface OmnibarContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  selectedAgent?: string;
  setSelectedAgent: (agent: string) => void;
  systemPrompt?: string;
  setSystemPrompt: (prompt: string) => void;
  currentProject?: string;
  setCurrentProject: (project: string) => void;
}

const OmnibarContext = createContext<OmnibarContextType | undefined>(undefined);

export function useOmnibar() {
  const context = useContext(OmnibarContext);
  if (!context) {
    throw new Error('useOmnibar must be used within OmnibarProvider');
  }
  return context;
}

interface OmnibarProviderProps {
  children: ReactNode;
}

export function OmnibarProvider({ children }: OmnibarProviderProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('default');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [currentProject, setCurrentProject] = useState<string | undefined>();

  // Hide Omnibar on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const shouldShowOmnibar = isVisible && !isAuthPage;

  const handleSendMessage = async (message: string, documents?: any[]) => {
    console.log('Sending message:', message, 'with documents:', documents);
    
    // TODO: Implement actual message sending logic
    // This should:
    // 1. Send to the selected agent
    // 2. Include attached documents
    // 3. Apply system prompt
    // 4. Handle streaming response
    // 5. Update relevant views (canvas, chat, etc.)
  };

  const handleAddCustomButton = () => {
    console.log('Adding custom button');
    // TODO: Implement custom button creation flow
  };

  return (
    <OmnibarContext.Provider
      value={{
        isVisible,
        setIsVisible,
        selectedAgent,
        setSelectedAgent,
        systemPrompt,
        setSystemPrompt,
        currentProject,
        setCurrentProject,
      }}
    >
      {children}
      {shouldShowOmnibar && (
        <OmnibarV2
          onSendMessage={handleSendMessage}
        />
      )}
    </OmnibarContext.Provider>
  );
}
