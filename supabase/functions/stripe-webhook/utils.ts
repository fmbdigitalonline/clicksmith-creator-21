import { BaseHeaders, WebhookResponse } from './types.ts';

export const baseHeaders: BaseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
  'Content-Type': 'application/json',
};

export function createErrorResponse(message: string, status: number) {
  console.error(`Error: ${message}`);
  return new Response(
    JSON.stringify({ error: message, type: 'webhook_processing_error' }), 
    { status, headers: baseHeaders }
  );
}

export function createSuccessResponse(data: WebhookResponse) {
  return new Response(
    JSON.stringify(data),
    { status: 200, headers: baseHeaders }
  );
}