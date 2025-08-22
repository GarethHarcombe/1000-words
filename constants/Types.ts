export type Word = {
    welsh: string;
    english: string;
    group: string; 
    numCorrect: number;
    streak: number;
    stage: number;
  };

  
  export type Town = {
    name: string;
    x: number;
    y: number;
    group: string; 
    stage: number;
    description: string;
    imagePath?: string; // Path to the town image
  }