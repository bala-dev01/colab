"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Mesh, Vector3 } from "three"
import { useStore } from "@/lib/store"

export default function HandCursor() {
  const meshRef = useRef<Mesh>(null)
  
  useFrame((state) => {
    const { hand } = useStore.getState()
    
    if (meshRef.current) {
        if (!hand.isPresent) {
            meshRef.current.visible = false
            return
        }
        
        meshRef.current.visible = true
        
        // Convert normalized (0-1) coordinates to Three.js world space
        // Assuming camera is at z=5, looking at 0,0,0
        // Viewport width/height depends on aspect ratio
        const { viewport } = state
        
        // x: 0 (left) -> 1 (right)  =>  -width/2 -> width/2
        // y: 0 (top) -> 1 (bottom)  =>  height/2 -> -height/2
        
        const x = (hand.x - 0.5) * viewport.width
        const y = -(hand.y - 0.5) * viewport.height
        
        // Smooth lerp for less jitter
        meshRef.current.position.lerp(new Vector3(x, y, 0), 0.2)
        
        // Visual feedback for pinch
        const scale = hand.isPinching ? 0.5 : 1
        meshRef.current.scale.lerp(new Vector3(scale, scale, scale), 0.2)
        
        // Color change on pinch
        const material = meshRef.current.material as any
        if (material) {
            material.color.set(hand.isPinching ? "#00ff88" : "#ffffff")
        }
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <ringGeometry args={[0.2, 0.25, 32]} />
      <meshBasicMaterial color="white" transparent opacity={0.8} />
    </mesh>
  )
}
