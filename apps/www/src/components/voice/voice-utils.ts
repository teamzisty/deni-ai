export const generateSpeech = async (text: string): Promise<Blob> => {
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (response.status === 422) {
      // Fallback to browser TTS (direct play, no blob needed)
      const errorData = await response.json();
      if (errorData.fallback) {
        playBrowserSpeech(text);
        // Return empty blob since browser TTS plays directly
        return new Blob([], { type: 'audio/wav' });
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Gemini TTS failed, using browser fallback:", error);
    playBrowserSpeech(text);
    return new Blob([], { type: 'audio/wav' });
  }
};

export const playBrowserSpeech = (text: string): void => {
  if (!('speechSynthesis' in window)) {
    console.error("Browser TTS not supported");
    return;
  }

  // Stop any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Find a good voice (prefer English or Japanese)
  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.lang.includes('en') || voice.lang.includes('ja')
  ) || voices[0];
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onerror = (error) => {
    console.error(`Browser TTS error: ${error.error}`);
  };

  speechSynthesis.speak(utterance);
};

export const playAudioBlob = (audioBlob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If blob is empty (browser TTS fallback), resolve immediately
    if (audioBlob.size === 0) {
      resolve();
      return;
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio();
    
    // Set up event listeners before setting src
    audio.onloadstart = () => {
      console.log("Audio loading started");
    };
    
    audio.oncanplay = () => {
      console.log("Audio can start playing");
    };
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      URL.revokeObjectURL(audioUrl);
      reject(new Error(`Failed to play audio: ${audio.error?.message || 'Unknown error'}`));
    };

    audio.onabort = () => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error("Audio playback aborted"));
    };
    
    // Set audio properties for better compatibility
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.src = audioUrl;
    
    // Try to play with error handling
    audio.play().catch((playError) => {
      console.error("Play failed:", playError);
      URL.revokeObjectURL(audioUrl);
      reject(new Error(`Play failed: ${playError.message}`));
    });
  });
};