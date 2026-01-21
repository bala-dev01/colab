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
        const model = genAI.getGenerativeModel({ model: "gemini-pro" })

        // We want structured output: simple HTML/Tailwind code for a UI component
        const systemPrompt = `
      You are an expert UI generator for a spatial computing interface.
      The user will ask for a UI element (e.g., "login card", "graph", "profile badge").
      
      You must return ONLY valid HTML code with Tailwind CSS classes.
      Do not include markdown backticks or explanations.
      The HTML should be a single root element (like a div).
      
      Design guidelines:
      - Use 'glassmorphism' (bg-white/10 backdrop-blur-md border border-white/20).
      - Text should be white or light gray.
      - Make it look futuristic and sleek.
      - Keep it compact.
    `

        console.log("Generating UI for prompt:", prompt)
        const result = await model.generateContent(`${systemPrompt}\n\nUser request: "${prompt}"`)
        const response = await result.response
        const text = response.text()
        console.log("Gemini Response:", text.substring(0, 50) + "...")

        // Cleanup potential markdown if Gemini adds it despite instructions
        const cleanText = text.replace(/```html/g, "").replace(/```/g, "")

        return { content: cleanText }
    } catch (error) {
        console.error("Detailed Gemini Error:", error)
        return { error: `Gemini Error: ${error instanceof Error ? error.message : String(error)}` }
    }
}
