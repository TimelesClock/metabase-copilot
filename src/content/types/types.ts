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
    type: 'user' | 'assistant';
    timestamp: string;
    raw_llm_response?: RawLLMContent[];
    metabase_question?: MetabaseQuestion;
}

// export interface MessageHistoryItem {
//     content: string;
//     type: 'user' | 'assistant';
//     timestamp: string;
// }

export interface GlobalState {
    configDict: ConfigDict;
    databaseName?: string;
    storeQueryContent?: string;
    isContentScriptLoaded: boolean;
    version: [number, number];
    previousQueryContents: string[];
    isOperationRunning: boolean;
    messageHistory: Message[];
}