// src/content/types/types.ts

import { ConfigDict } from "../../types/chromeStorage";
import { MetabaseQuestion } from "../utils/loadMetabaseQuestion";

export interface RawLLMContent {
    type: string;
    text?: string;
    id?: string;
    name?: string;
    input?: any;
}

export interface Message {
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    raw_llm_response?: RawLLMContent[];
    metabase_question?: MetabaseQuestion | null;
    tool_calls?: string; // XML string for tool calls
}
export interface MessageHistory {
    query: Message[];
    dashboard: Message[];
}

export interface DashboardState {
    isActive: boolean;
    collectionId?: number;
    dashboardId?: number;
    sessionName?: string;
}

export interface GlobalState {
    configDict: ConfigDict;
    databaseName?: string;
    storeQueryContent?: string;
    isContentScriptLoaded: boolean;
    version: [number, number];
    previousQueryContents: string[];
    isOperationRunning: boolean;
    messageHistory: MessageHistory;
    dashboard: DashboardState;
}

export interface DashboardToolCall {
    type: "create_chart" | "rearrange_dashboard" | "update_chart" | "delete_chart" | "preview_chart" | "load_chart" | "add_markdown" | "list_charts" | "get_dashboard_cards";
    params: any;
}

export type QueryType = "chart" | "dashboard"