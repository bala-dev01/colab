"use client"

import { useEffect, useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { Pencil, Loader2 } from "lucide-react"

export default function AirWritingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isWriting, setIsWriting] = useState(false)
    const [isRecognizing, setIsRecognizing] = useState(false)
    const lastPointRef = useRef<{x: number, y: number} | null>(null)
    const strokeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    
    const hand = useStore((state) => state.hand)
    const setInput = useStore((state) => state.setInput)
    
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Set canvas size to window size
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        
        // Configure drawing style
        ctx.strokeStyle = '#00ff88'
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
    }, [])
    
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Debug: Log hand state
        console.log('Hand state:', { isPointing: hand.isPointing, isPresent: hand.isPresent, x: hand.x, y: hand.y })
        
        // Check if pointing gesture (index finger extended, others closed)
        if (hand.isPointing && hand.isPresent) {
            const x = hand.x * canvas.width
            const y = hand.y * canvas.height
            
            console.log('Writing at:', x, y)
            
            if (!isWriting) {
                setIsWriting(true)
                lastPointRef.current = { x, y }
            } else if (lastPointRef.current) {
                // Draw line from last point to current point
                ctx.beginPath()
                ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
                ctx.lineTo(x, y)
                ctx.stroke()
                lastPointRef.current = { x, y }
            }
            
            // Reset stroke timeout
            if (strokeTimeoutRef.current) {
                clearTimeout(strokeTimeoutRef.current)
            }
            
            // Set timeout to recognize text after 1.5 seconds of no movement
            strokeTimeoutRef.current = setTimeout(() => {
                recognizeText()
            }, 1500)
        } else {
            // Hand lost or gesture changed
            if (isWriting) {
                recognizeText()
            }
        }
    }, [hand.x, hand.y, hand.isPointing, hand.isPresent, isWriting])
    
    const recognizeText = async () => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Check if there's anything drawn
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const hasContent = imageData.data.some(pixel => pixel !== 0)
        
        if (!hasContent) {
            setIsWriting(false)
            lastPointRef.current = null
            return
        }
        
        setIsRecognizing(true)
        
        try {
            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), 'image/png')
            })
            
            // Send to server action for recognition
            const formData = new FormData()
            formData.append('image', blob, 'handwriting.png')
            
            const response = await fetch('/api/recognize-handwriting', {
                method: 'POST',
                body: formData
            })
            
            const { text } = await response.json()
            
            if (text && text.trim()) {
                // Populate chat input with recognized text
                setInput(text.trim())
            }
        } catch (error) {
            console.error('Failed to recognize handwriting:', error)
        } finally {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            setIsWriting(false)
            setIsRecognizing(false)
            lastPointRef.current = null
        }
    }
    
    // Debug: Log component mount
    useEffect(() => {
        console.log('AirWritingCanvas mounted!')
        return () => console.log('AirWritingCanvas unmounted!')
    }, [])
    
    return (
        <>
            <canvas
                ref={canvasRef}
                className="fixed inset-0 z-30 pointer-events-none"
                style={{ mixBlendMode: 'screen' }}
            />
            
            {/* Writing indicator - only show when active */}
            {(isWriting || isRecognizing) && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                    <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 shadow-2xl">
                        <div className="flex items-center gap-3">
                            {isRecognizing ? (
                                <>
                                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                                    <span className="text-white font-medium">Recognizing...</span>
                                </>
                            ) : (
                                <>
                                    <Pencil className="w-5 h-5 text-cyan-400" />
                                    <span className="text-white font-medium">Writing Mode Active</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
