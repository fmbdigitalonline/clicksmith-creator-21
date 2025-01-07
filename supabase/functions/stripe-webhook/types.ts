import { Stripe } from 'https://esm.sh/stripe@14.21.0';

export interface WebhookResponse {
  received: boolean;
  error?: string;
  type?: string;
}

export interface BaseHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Content-Type': string;
}