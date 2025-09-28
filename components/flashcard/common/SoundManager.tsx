// common/SoundManager.ts
import { useEffect, useMemo } from 'react';
import { soundMap } from '@/constants/soundMap';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

export function usePlayWord(word: string) {
  const key = useMemo(() => word?.toLowerCase?.() ?? '', [word]);
  const source = soundMap[key];
  const player = useAudioPlayer(source);

  useEffect(() => {
    // Safe to call once at app root too
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const playAudioWord = async () => {
    try {
      if (!source) {
        console.warn(`No audio found for "${key}"`);
        return;
      }
      // player.seekTo(0); // uncomment if you want to restart each tap
      await player.play();
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  };

  return { playAudioWord, hasSource: !!source };
}