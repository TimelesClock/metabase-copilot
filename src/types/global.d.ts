// src/types/global.d.ts
export {};

declare global {
    interface Window {
        MetabaseHelper?: {
            updateQuestion: ( updates: any) => Promise<void>;
        };
    }
  }