
import { useCallback } from 'react';

export const useSpeechSynthesis = (isEnabled: boolean) => {
  const speak = useCallback((text: string) => {
    if (!isEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Text-to-speech not supported or failed.', e);
    }
  }, [isEnabled]);

  return { speak };
};
