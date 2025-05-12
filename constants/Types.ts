export type Word = {
    index: number;
    welsh: string;
    english: string;
    numCorrect: number;
    streak: number;
    stage: number;
  };

  
  export type Town = {
    name: string;
    x: number;
    y: number;
    stage: number;
    description: string;
    image?: string; // Path to the town image
  }