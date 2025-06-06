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
    imagePath?: string; // Path to the town image
  }