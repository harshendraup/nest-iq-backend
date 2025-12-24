
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export class GeminiService {
    private model: any;

    constructor() {
        this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    }

    async generateCode(prompt: string): Promise<any> {
        try {
            const systemPrompt = `
                You are an expert Frontend Developer and UI Designer. Your task is to generate clean, modern, and responsive HTML, CSS (using Tailwind classes where possible or custom styles), and JavaScript based on the user's prompt.
                
                Return ONLY a JSON object with the following structure. Do not include any markdown formatting or explanations outside the JSON.
                
                {
                    "html": "string (The full HTML structure, body content only)",
                    "css": "string (Custom CSS styles if needed, empty if using only Tailwind)",
                    "js": "string (JavaScript functionality, if any)"
                }

                Ensure the design is modern, aesthetically pleasing (Google/Stitch style), and responsive. Use Tailwind CSS via CDN link in the HTML if you normally would, but for this JSON, just assume Tailwind classes work on the elements.
            `;

            const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            // Clean up potentially wrapped markdown code blocks if the model ignores instruction
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            return JSON.parse(cleanedText);
        } catch (error) {
            console.error("Error generating code with Gemini:", error);
            throw new Error("Failed to generate code.");
        }
    }
}

export const geminiService = new GeminiService();
