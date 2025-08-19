import { useState } from 'react';
import { Word } from '@/constants/Types';

export function useFlashcardProgress(words: Word[], setWords: (words: Word[]) => void) {
  const [index, setIndex] = useState(0);
  const [wordHistory, setWordHistory] = useState<{welsh: string, timestamp: number}[]>([]);

  const suggestNextWord = () => {
    const now = Date.now();
    
    // First, count words in each stage category
    const stageCounts = {0: 0, 1: 0, 2: 0, 3: 0};
    words.forEach(word => {
      if (word.stage === 0 || word.stage === 1 || word.stage === 2 || word.stage === 3) {
        stageCounts[word.stage]++;
      }
    });
    
    // Calculate the total number of words in stages 1 and 2
    const seenPracticedCount = stageCounts[1] + stageCounts[2];
    
    // Determine if we should introduce a new word
    // Introduce new words if less than 3 words in stages 1-2
    const MAX_SEEN_PRACTICED = 7;
    const shouldIntroduceNew = seenPracticedCount < MAX_SEEN_PRACTICED && stageCounts[0] > 0;
    
    // Define optimal review intervals for each stage (in milliseconds)
    const reviewIntervals = {
      1: 20 * 1000,         // 20 seconds for stage 1
      2: 2 * 60 * 1000      // 2 minutes for stage 2
    };
    
    // Calculate a "readiness score" for each word
    const scoredWords = words.map((word, idx) => {
      // Skip current word and mastered words
      if (idx === index || word.stage === 3) return { word, idx, score: -Infinity };
      
      // Start with a base score
      let score = 0;
      
      // If we should introduce new words, boost stage 0 scores
      if (shouldIntroduceNew && word.stage === 0) {
        score += 1000;
      } else if (!shouldIntroduceNew && word.stage === 0) {
        // Penalize new words when we're focusing on review
        score -= 500;
      }
      
      // Find when this word was last studied
      const lastSeen = wordHistory
        .filter(entry => entry.welsh === word.welsh)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (lastSeen) {
        const timeSinceLastSeen = now - lastSeen.timestamp;
        
        // For stage 1-2 words, check if they're due for review based on optimal interval
        if (word.stage == 1 || word.stage == 2) {
          const optimalInterval = reviewIntervals[word.stage];
          
          if (timeSinceLastSeen >= optimalInterval) {
            // Word is due or overdue for review - prioritize it
            // The more overdue, the higher the priority
            const overdueRatio = timeSinceLastSeen / optimalInterval;
            score += Math.min(overdueRatio * 100, 500); // Cap at 500 to prevent extreme values
          } else {
            // Word is seen too recently - penalize
            score -= (1 - timeSinceLastSeen / optimalInterval) * 200;
          }
        }
      } else {
        // Word has never been seen - if it's not stage 0, it should be prioritized
        if (word.stage > 0) {
          score += 300;
        }
      }
      
      // Add a small random factor to prevent predictable patterns
      score += Math.random() * 50;
      
      return { word, idx, score };
    });
    
    // Filter out impossibly low scores and sort by score (highest first)
    const candidates = scoredWords
      .filter(item => item.score > -Infinity)
      .sort((a, b) => b.score - a.score);
    
    // If no candidates found, just return (all words mastered)
    if (candidates.length === 0) return;
    
    // Select the highest scoring word
    const selected = candidates[0];
    
    // Update word history
    setWordHistory(prev => [...prev, { welsh: selected.word.welsh, timestamp: now }]);
    
    // Set the index to the selected word
    setIndex(selected.idx);
  };

  const advanceStage = () => {
    const updatedWords = [...words];
    if (updatedWords[index].stage < 3) {
      updatedWords[index].stage += 1;
    }
    setWords(updatedWords);
  };

  const nextWord = () => {
    // Update history
    const now = Date.now();
    setWordHistory(prev => [...prev, { welsh: words[index].welsh, timestamp: now }]);
    
    // Move to next word
    suggestNextWord();
  };

  const handleCorrectAnswer = () => {
    const updatedWords = [...words];
    updatedWords[index].streak += 1;
    if (updatedWords[index].stage == 0 || updatedWords[index].streak == 3) {
      if (updatedWords[index].stage < 3) {
        updatedWords[index].stage += 1;
      }
      updatedWords[index].streak = 0;
    }
    setWords(updatedWords);
    nextWord();
  };

  const handleFalseAnswer = () => {
    const updatedWords = [...words];
    updatedWords[index].streak = 0;
    setWords(updatedWords);
    nextWord();
  };

  const getFillerAnswers = (selectedWord: Word) => {
    const selectedWords: string[] = words
      .filter(w => w.stage >= 0 && w !== selectedWord)
      .map(word => word.english);
    return [...selectedWords, "hello", "thank you", "goodbye"].slice(0, 3);
  };

  return {
    currentWord: words[index],
    handleCorrectAnswer,
    handleFalseAnswer,
    getFillerAnswers,
    suggestNextWord,
  };
}