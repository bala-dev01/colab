'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini
// Note: In a real app, ensure process.env.GEMINI_API_KEY is set
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function generateUI(prompt: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { error: "Gemini API Key is missing. Please set GEMINI_API_KEY in .env.local" }
    }

    // Re-initialize to ensure env var is picked up
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    try {
        // Using Gemini 2.5 Flash Image (codename: Nano Banana)
        // Fast, efficient image generation model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" })

        console.log("Generating Image for prompt:", prompt)

        // Simple, direct prompt - this model is designed for image generation
        const result = await model.generateContent(prompt)
        const response = await result.response

        // console.log("Gemini Response structure:", JSON.stringify(response, null, 2)) // Too huge
        console.log("Gemini Response received.")

        // Extract Image Data
        // Search all parts for image data
        const parts = response.candidates?.[0]?.content?.parts || []

        for (const part of parts) {
            if ('inlineData' in part && part.inlineData) {
                const base64Image = part.inlineData.data
                const mimeType = part.inlineData.mimeType || "image/png"

                const imgHtml = `<img src="data:${mimeType};base64,${base64Image}" alt="${prompt}" class="rounded-lg shadow-2xl border border-white/20" />`
                return { content: imgHtml }
            }
        }

        // Fallback: Check if text looks like a failure or valid content
        const text = response.text()

        // DEBUG: Log first 100 chars to see what it said
        console.log("AI Text Response (truncated):", text.substring(0, 100))

        // If no image found, DO NOT return text. It breaks the UI.
        return { error: "AI generated text description instead of an image. Please try 'Image of [topic]'." }

    } catch (error) {
        console.error("Detailed Gemini Error:", error)
        return { error: `Gemini Error: ${error instanceof Error ? error.message : String(error)}` }
    }
}
