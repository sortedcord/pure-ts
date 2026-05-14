import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import type { ILLMProvider, LLMRequest, LLMResponse } from "./llm.js";

export class GeminiProvider implements ILLMProvider {
    providerName = "Gemini-3-Flash";
    private genAI: GoogleGenAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenAI({ apiKey });
    }

    async generateStructuredResponse<T extends z.ZodTypeAny>(
        request: LLMRequest<T>
    ): Promise<LLMResponse<z.infer<T>>> {
        try {
            // Convert Zod to JSON Schema
            const jsonSchema = zodToJsonSchema(request.schema as any);

            const result = await this.genAI.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [
                    { role: "user", parts: [{ text: `${request.systemPrompt}\n\nContext: ${request.userContext}` }] }
                ],
                config: {
                    temperature: request.temperature ?? 0.7,
                    responseMimeType: "application/json",
                    // Gemini expects the schema directly in the config
                    responseSchema: jsonSchema as any, 
                },
            });

            const responseText = result.text;

            // if responseText is undefined
            if (!responseText) {
                return { success: false, error: "No response from Gemini" };
            }
            
            // Validate the response against the Zod schema
            const parsedData = request.schema.parse(JSON.parse(responseText));

            return {
                success: true,
                data: parsedData
            };

        } catch (error) {
            console.error(`[GeminiProvider] Error:`, error);
            return { success: false, error: String(error) };
        }
    }
}