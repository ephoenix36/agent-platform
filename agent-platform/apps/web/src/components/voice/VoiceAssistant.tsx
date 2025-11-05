"use client";

import { useEffect, useState, useCallback } from "react";
import { Mic, X, Volume2 } from "lucide-react";

interface VoiceAssistantProps {
  onClose: () => void;
}

export function VoiceAssistant({ onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const startListening = useCallback(() => {
    // Web Speech API implementation
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        // Process command here
        processCommand(transcript);
      };
      
      recognition.start();
    } else {
      setResponse("Speech recognition not supported in this browser");
    }
  }, [transcript]);

  const processCommand = (command: string) => {
    // Simple command processing - will be replaced with NLP
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes("create agent")) {
      setResponse("Creating a new agent...");
    } else if (lowerCommand.includes("run") || lowerCommand.includes("execute")) {
      setResponse("Executing agent...");
    } else {
      setResponse(`I heard: "${command}". How can I help you?`);
    }
  };

  useEffect(() => {
    if (response) {
      speak(response);
    }
  }, [response]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-2xl p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <span className="font-semibold">Voice Assistant</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={startListening}
            disabled={isListening}
            className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              isListening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <Mic className="w-5 h-5" />
            {isListening ? "Listening..." : "Click to speak"}
          </button>
        </div>

        {transcript && (
          <div className="mb-2 p-2 bg-secondary/20 rounded text-sm">
            <span className="text-muted-foreground">You said:</span>
            <p className="mt-1">{transcript}</p>
          </div>
        )}

        {response && (
          <div className="p-2 bg-primary/10 rounded text-sm">
            <span className="text-muted-foreground">Assistant:</span>
            <p className="mt-1">{response}</p>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          Try saying: "Create a new agent" or "Run the workflow"
        </div>
      </div>
    </div>
  );
}
