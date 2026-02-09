import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const imageFile = formData.get('image') as Blob

        if (!imageFile) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 })
        }

        // Convert blob to base64
        const bytes = await imageFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64Image = buffer.toString('base64')

        // Use same model as actions.ts which is confirmed working
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

        const prompt = 'Look at this handwritten text image and return ONLY the text you see. If you cannot read any text, return an empty response. Do not include any explanations.'

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Image
                }
            }
        ])
        const response = await result.response
        const text = response.text().trim()

        return NextResponse.json({ text })
    } catch (error) {
        console.error('Handwriting recognition error:', error)
        return NextResponse.json({ error: 'Failed to recognize handwriting' }, { status: 500 })
    }
}
