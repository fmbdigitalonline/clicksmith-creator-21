
// Deepeek API types and utilities
export interface DeepeekResponse {
  choices: {
    text: string;
    index: number;
    finish_reason: string;
  }[];
}

export interface DeepeekError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}
