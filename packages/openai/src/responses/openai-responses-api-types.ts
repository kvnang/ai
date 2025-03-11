import { JSONSchema7 } from '@ai-sdk/provider';
import {
  computerActionSchema,
  computerSafetyCheckSchema,
} from './openai-responses-language-model';
import { z } from 'zod';

export type OpenAIResponsesPrompt = Array<OpenAIResponsesMessage>;

export type OpenAIResponsesMessage =
  | OpenAIResponsesSystemMessage
  | OpenAIResponsesUserMessage
  | OpenAIResponsesAssistantMessage
  | OpenAIResponsesFunctionCall
  | OpenAIResponsesFunctionCallOutput
  | OpenAIResponsesComputerCall
  | OpenAIResponsesComputerCallOutput;

export type OpenAIResponsesSystemMessage = {
  role: 'system' | 'developer';
  content: string;
};

export type OpenAIResponsesUserMessage = {
  role: 'user';
  content: Array<
    | { type: 'input_text'; text: string }
    | { type: 'input_image'; image_url: string }
  >;
};

export type OpenAIResponsesAssistantMessage = {
  role: 'assistant';
  content: Array<{ type: 'output_text'; text: string }>;
};

export type OpenAIResponsesFunctionCall = {
  type: 'function_call';
  call_id: string;
  name: string;
  arguments: string;
};

export type OpenAIResponsesFunctionCallOutput = {
  type: 'function_call_output';
  call_id: string;
  output: string;
};

export type OpenAIResponsesComputerCall = {
  type: 'computer_call';
  id: string;
  call_id: string;
  action: z.infer<typeof computerActionSchema>;
  pending_safety_checks: Array<z.infer<typeof computerSafetyCheckSchema>>;
};

export type OpenAIResponsesComputerCallOutput = {
  type: 'computer_call_output';
  call_id: string;
  output: { type: 'input_image'; image_url: string };
  acknowledged_safety_checks: Array<z.infer<typeof computerSafetyCheckSchema>>;
};

export type OpenAIResponsesTool =
  | {
      type: 'function';
      name: string;
      description: string | undefined;
      parameters: JSONSchema7;
      strict?: boolean;
    }
  | {
      type: 'web_search_preview';
      search_context_size: 'low' | 'medium' | 'high';
      user_location: {
        type: 'approximate';
        city: string;
        region: string;
      };
    }
  | {
      type: 'computer_use_preview';
      display_width: number;
      display_height: number;
      environment: 'mac' | 'windows' | 'linux' | 'browser';
    };
