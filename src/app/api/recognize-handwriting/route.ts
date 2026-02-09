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

        // Use Gemini Vision to recognize handwriting
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Image
                }
            },
            'Recognize and return ONLY the handwritten text in this image. If you see letters, numbers, or words, return them exactly as written. If the image is empty or you cannot recognize any text, return an empty string. Do not include any explanations or additional text.'
        ])

        const response = await result.response
        const text = response.text().trim()

        return NextResponse.json({ text })
    } catch (error) {
        console.error('Handwriting recognition error:', error)
        return NextResponse.json({ error: 'Failed to recognize handwriting' }, { status: 500 })
    }
}
