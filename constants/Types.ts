export type Word = {
    index: number;
    foreign: string;
    native: string;
    group: string; 
    numCorrect: number;
    streak: number;
    stage: number;
    nextDue?: number;
    lastSeen?: number;
  };

  
  export type Town = {
    name: string;
    x: number;
    y: number;
    group: string;
    groupID: number; 
    stage: number;
    description: string;
    imagePath?: string; // Path to the town image
  }