"use client"

import { Html } from "@react-three/drei"
import { useRef, memo, useState } from "react"
import { type FloatingObject } from "@/lib/store"
import { useStore } from "@/lib/store"
import { useFrame, useThree } from "@react-three/fiber"
import { Vector3 } from "three"
import { useDrag } from "@use-gesture/react"

// Helper to sanitize/render raw HTML safely
const SafeHtml = ({ html }: { html: string }) => {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function FloatingElement({ data }: { data: FloatingObject }) {
    const groupRef = useRef<any>(null)
    const meshRef = useRef<any>(null)
    const updateObject = useStore((state) => state.updateObject)
    const { size, viewport } = useThree()
    
    // Hand Gesture Interaction State
    const isDragging = useRef(false)
    const dragOffset = useRef(new Vector3())
    const isScaling = useRef(false)
    const initialScale = useRef(1)
    const initialDistance = useRef(0)
    
    // Mouse Interaction State
    const [isHovered, setIsHovered] = useState(false)
    const isMouseDragging = useRef(false)
    
    // Proper mouse drag using @use-gesture/react
    const bind = useDrag(
        ({ offset: [x, y], first, last }) => {
            if (!groupRef.current) return
            
            if (first) {
                isMouseDragging.current = true
            }
            
            // Convert pixel offset to world coordinates
            const worldX = (x / size.width) * viewport.width - viewport.width / 2
            const worldY = -(y / size.height) * viewport.height + viewport.height / 2
            
            groupRef.current.position.x = worldX
            groupRef.current.position.y = worldY
            
            if (last) {
                isMouseDragging.current = false
                // Save final position
                updateObject(data.id, {
                    position: [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z]
                })
            }
        },
        {
            from: () => {
                if (!groupRef.current) return [0, 0]
                const x = ((groupRef.current.position.x + viewport.width / 2) / viewport.width) * size.width
                const y = ((-groupRef.current.position.y + viewport.height / 2) / viewport.height) * size.height
                return [x, y]
            }
        }
    )
    
    const handleWheel = (e: any) => {
        if (groupRef.current) {
            e.stopPropagation()
            const scaleDelta = e.delta > 0 ? 0.9 : 1.1
            const newScale = Math.max(0.3, Math.min(3.0, groupRef.current.scale.x * scaleDelta))
            groupRef.current.scale.set(newScale, newScale, newScale)
            
            // Save scale
            updateObject(data.id, {
                scale: [newScale, newScale, newScale]
            })
        }
    }
    
    useFrame((state) => {
        // Access fresh state directly without triggering re-renders
        const { hand, twoHandState } = useStore.getState()
        
        if (!groupRef.current) return
        
        const { viewport } = state
        
        // Skip hand gestures while mouse dragging
        if (isMouseDragging.current) return
        
        // TWO-HAND PINCH-TO-ZOOM GESTURE
        if (twoHandState.isTwoHandPinching && twoHandState.leftHand && twoHandState.rightHand) {
            // Calculate center point between both hands
            const centerX = ((twoHandState.leftHand.x + twoHandState.rightHand.x) / 2 - 0.5) * viewport.width
            const centerY = -((twoHandState.leftHand.y + twoHandState.rightHand.y) / 2 - 0.5) * viewport.height
            const centerPos = new Vector3(centerX, centerY, 0)
            
            const objPos = groupRef.current.position
            const dist = centerPos.distanceTo(objPos)
            
            // Check if this object is close to the center point
            if (dist < 1.5 && !isScaling.current) {
                // Start scaling
                isScaling.current = true
                initialDistance.current = twoHandState.twoHandDistance
                initialScale.current = groupRef.current.scale.x
            }
            
            if (isScaling.current) {
                // Calculate scale based on distance change
                const scaleFactor = twoHandState.twoHandDistance / initialDistance.current
                const newScale = Math.max(0.3, Math.min(3.0, initialScale.current * scaleFactor))
                groupRef.current.scale.set(newScale, newScale, newScale)
            }
        } else {
            // Reset scaling when gesture ends
            if (isScaling.current) {
                isScaling.current = false
                // Save final scale
                updateObject(data.id, {
                    scale: [groupRef.current.scale.x, groupRef.current.scale.y, groupRef.current.scale.z]
                })
            }
        }
        
        // SINGLE-HAND PINCH GESTURE (Drag)
        if (hand.isPinching && hand.isPresent) {
            const handX = (hand.x - 0.5) * viewport.width
            const handY = -(hand.y - 0.5) * viewport.height
            const handPos = new Vector3(handX, handY, 0)
            
            if (!isDragging.current) {
                const objPos = groupRef.current.position
                const dist = handPos.distanceTo(objPos)
                
                if (dist < 1.5) {
                    isDragging.current = true
                    dragOffset.current.copy(objPos).sub(handPos)
                }
            }
            
            if (isDragging.current) {
                groupRef.current.position.copy(handPos.add(dragOffset.current))
            }
        } else {
            if (isDragging.current) {
                isDragging.current = false
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
            scale={new Vector3(...data.scale)}
        >
            {/* Invisible mesh for mouse interaction - larger to cover entire content */}
            <mesh
                ref={meshRef}
                {...bind()}
                onPointerEnter={() => setIsHovered(true)}
                onPointerLeave={() => setIsHovered(false)}
                onWheel={handleWheel}
            >
                <planeGeometry args={[5, 4]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
            
            <Html 
                transform 
                distanceFactor={1.5}
                position={[0, 0, 0]}
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                    cursor: isHovered ? 'grab' : 'default',
                    opacity: isHovered ? 1 : 0.9,
                    transition: 'opacity 0.2s'
                }}
            >
                <div className="w-64 max-w-sm pointer-events-none select-none">
                    <SafeHtml html={data.content} />
                </div>
            </Html>
        </group>
    )
}

export default memo(FloatingElement)
