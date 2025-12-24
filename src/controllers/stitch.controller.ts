
import { Request, Response } from "express";
import { geminiService } from "../services/gemini.service.js";

export const generateUI = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        const generatedCode = await geminiService.generateCode(prompt);

        return res.status(200).json({
            success: true,
            data: generatedCode,
        });
    } catch (error: any) {
        console.error("Stitch generation error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate UI",
            error: error.message,
        });
    }
};
