export function sanitizePrompt(prompt: string): string {
  const sanitized = prompt
    .replace(/[^\w\s,.!?()-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (sanitized.length < 20) {
    throw new Error('Prompt is too short after sanitization');
  }
  
  return sanitized;
}

export function transformPrompt(prompt: string, attempt: number): string {
  const variations = [
    (p: string) => `Professional business image showing: ${p}`,
    (p: string) => `Corporate style visualization of: ${p}`,
    (p: string) => `Modern business representation depicting: ${p}`,
    (p: string) => `Clean, minimal business scene showing: ${p}`,
  ];
  
  const variationIndex = attempt % variations.length;
  return variations[variationIndex](prompt);
}

export function validateBusinessContext(businessIdea: any): void {
  if (!businessIdea.description || businessIdea.description.length < 10) {
    throw new Error('Business description is too vague or missing');
  }
  
  if (!businessIdea.valueProposition || businessIdea.valueProposition.length < 10) {
    throw new Error('Value proposition is too vague or missing');
  }
}