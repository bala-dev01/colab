"use client"

import { Html } from "@react-three/drei"
import { useRef, memo } from "react"
import { type FloatingObject } from "@/lib/store"
import { useStore } from "@/lib/store"
import { useFrame } from "@react-three/fiber"
import { Vector3 } from "three"

// Helper to sanitize/render raw HTML safely (in a real app, use dompurify)
const SafeHtml = ({ html }: { html: string }) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function FloatingElement({ data }: { data: FloatingObject }) {
    const groupRef = useRef<any>(null)
    const updateObject = useStore((state) => state.updateObject)
    
    // Interaction State
    const isDragging = useRef(false)
    const dragOffset = useRef(new Vector3())
    
    useFrame((state) => {
        // Access fresh state directly without triggering re-renders
        const { hand } = useStore.getState()
        
        if (!groupRef.current) return
        
        const { viewport } = state
        
        // Convert Hand 0-1 to World Pos
        const handX = (hand.x - 0.5) * viewport.width
        const handY = -(hand.y - 0.5) * viewport.height
        const handPos = new Vector3(handX, handY, 0)
        
        const objPos = groupRef.current.position 
        const dist = handPos.distanceTo(objPos)
        
        // Debug logging (throttled)
        if (Math.random() < 0.01) {
             // console.log("Dist:", dist, "Pinch:", hand.isPinching, "Dragging:", isDragging.current)
        }

        if (hand.isPinching) {
            // Pick up if close enough (1.2 units - significantly larger interaction zone)
            if (dist < 1.2 && !isDragging.current) {
                isDragging.current = true
                
                // Calculate OFFSET: Vector from Hand to Object Center
                dragOffset.current.subVectors(groupRef.current.position, handPos)
            }
            
            if (isDragging.current) {
                // Target Position = Hand Position + Initial Offset
                const targetPos = new Vector3().addVectors(handPos, dragOffset.current)
                
                // Smooth follow - increased lerp for more responsive movement
                groupRef.current.position.lerp(targetPos, 0.8)
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
                    pointerEvents: 'none',
                    userSelect: 'none',
                    willChange: 'transform', // GPU acceleration hint
                    backfaceVisibility: 'hidden', // Reduce repaints
                    transform: 'translateZ(0)' // Force GPU layer
                }}
            >
                <div className="w-64 max-w-sm pointer-events-none select-none">
                    <SafeHtml html={data.content} />
                </div>
            </Html>
        </group>
    )
}

// Memoize to prevent unnecessary re-renders
export default memo(FloatingElement, (prev, next) => {
    return prev.data.id === next.data.id && 
           prev.data.content === next.data.content &&
           prev.data.position[0] === next.data.position[0] &&
           prev.data.position[1] === next.data.position[1] &&
           prev.data.position[2] === next.data.position[2]
})
