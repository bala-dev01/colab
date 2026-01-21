"use client"

import { Html } from "@react-three/drei"
import { useRef } from "react"
import { type FloatingObject } from "@/lib/store"
import { useStore } from "@/lib/store"
import { useFrame } from "@react-three/fiber"
import { Vector3 } from "three"

// Helper to sanitize/render raw HTML safely (in a real app, use dompurify)
const SafeHtml = ({ html }: { html: string }) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export default function FloatingElement({ data }: { data: FloatingObject }) {
    const groupRef = useRef<any>(null)
    const { hand } = useStore() // Get hand state
    const updateObject = useStore((state) => state.updateObject)
    
    // Interaction State
    const isDragging = useRef(false)
    const dragOffset = useRef(new Vector3())
    
    useFrame((state) => {
        // Simple Drag Logic:
        // If hand is pinching AND bubbling collision logic matches this object...
        // For MVP, if hand is close to object center and pinching, start drag.
        
        if (!groupRef.current) return
        
        const { viewport } = state
        
        // Convert Hand 0-1 to World Pos
        const handX = (hand.x - 0.5) * viewport.width
        const handY = -(hand.y - 0.5) * viewport.height
        const handPos = new Vector3(handX, handY, 0)
        
        const objPos = groupRef.current.position 
        const dist = handPos.distanceTo(objPos)
        
        if (hand.isPinching) {
            // Pick up if close enough (0.5 units)
            if (dist < 0.5 && !isDragging.current) {
                // Check if another object isn't already being dragged? (Global store 'draggedID')
                // For MVP, simplest logic:
                isDragging.current = true
            }
            
            if (isDragging.current) {
                // Follow hand
                // Update global state so it persists if we unmount/remount
                // Smooth follow
                groupRef.current.position.lerp(handPos, 0.2)
            }
        } else {
            // Release
            if (isDragging.current) {
                isDragging.current = false
                // Save final position to store
                updateObject(data.id, {
                    position: [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z]
                })
            }
        }
    })

    return (
        <group 
            ref={groupRef} 
            position={new Vector3(...data.position)}
        >
            <Html 
                transform 
                distanceFactor={1.5}
                position={[0, 0, 0]}
                style={{
                    pointerEvents: 'none', // Let clicks pass through, we use hand tracking
                    userSelect: 'none'
                }}
            >
                <div className="w-64 max-w-sm pointer-events-none select-none">
                    <SafeHtml html={data.content} />
                </div>
            </Html>
        </group>
    )
}
