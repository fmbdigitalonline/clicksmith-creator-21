export const sanitizePrompt = (prompt: string): string => {
  return prompt
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s,.!?-]/g, '')
    .slice(0, 1000);
};

export const validateBusinessContext = (businessIdea: any): void => {
  if (!businessIdea?.description || businessIdea.description.length < 10) {
    throw new Error('Business description is too vague or missing');
  }
  
  if (!businessIdea?.valueProposition || businessIdea.valueProposition.length < 10) {
    throw new Error('Value proposition is too vague or missing');
  }
};