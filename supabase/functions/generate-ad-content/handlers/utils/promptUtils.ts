export const sanitizePrompt = (prompt: string): string => {
  return prompt
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s,.!?-]/g, '')
    .slice(0, 1000);
};

export const applyPromptVariations = (prompt: string, attempt: number): string => {
  const variations = [
    (p: string) => p,
    (p: string) => `Create a professional photograph: ${p}`,
    (p: string) => `Generate a commercial image showing: ${p}`,
    (p: string) => `Professional DSLR photo of: ${p}`,
    (p: string) => `High-quality advertising photograph depicting: ${p}`,
    (p: string) => `Commercial photography showcasing: ${p}`,
  ];
  
  const variationIndex = attempt % variations.length;
  return variations[variationIndex](prompt);
};

export const validateBusinessContext = (businessIdea: any): void => {
  if (!businessIdea?.description || businessIdea.description.length < 10) {
    throw new Error('Business description is too vague or missing');
  }
  
  if (!businessIdea?.valueProposition || businessIdea.valueProposition.length < 10) {
    throw new Error('Value proposition is too vague or missing');
  }
};