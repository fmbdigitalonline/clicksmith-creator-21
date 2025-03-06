
/**
 * Submits a form programmatically
 * @param formSelector - CSS selector for the form to submit
 * @returns true if the form was submitted successfully, false otherwise
 */
export const submitFormBySelector = (formSelector: string = 'form'): boolean => {
  try {
    const form = document.querySelector(formSelector) as HTMLFormElement;
    
    if (!form) {
      console.error('Form not found with selector:', formSelector);
      return false;
    }
    
    // Create and dispatch a submit event
    const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
    const submitted = form.dispatchEvent(submitEvent);
    
    return submitted;
  } catch (error) {
    console.error('Error submitting form:', error);
    return false;
  }
};
