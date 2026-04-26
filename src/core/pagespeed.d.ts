export interface RunPagespeedInput {
  url: string;
  strategy?: "mobile" | "desktop";
  categories?: string[];
  locale?: string;
  timeout_seconds?: number;
  include_raw?: boolean;
  utm_campaign?: string;
  utm_source?: string;
  captcha_token?: string;
}

export interface ComparePagespeedInput {
  url: string;
  categories?: string[];
  locale?: string;
  timeout_seconds?: number;
  utm_campaign?: string;
  utm_source?: string;
  captcha_token?: string;
}

export function runPagespeedTool(input: RunPagespeedInput): Promise<unknown>;
export function comparePagespeedTool(input: ComparePagespeedInput): Promise<unknown>;
export const DEFAULT_ALLOWED_OUTBOUND_HOSTS: string[];
export function getAllowedOutboundHosts(): string[];
export function assertAllowedOutboundHost(endpoint: string, allowedHosts?: string[]): void;
