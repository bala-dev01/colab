"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense } from "react"
import HandCursor from "./HandCursor"
import FloatingElement from "./FloatingElement"
import { useStore } from "@/lib/store"

function SceneContent() {
    const objects = useStore((state) => state.objects)
    
    console.log('[SCENE] Rendering with', objects.length, 'objects')
    
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            
            <HandCursor />
            
            {objects.map((obj) => (
                <FloatingElement key={obj.id} data={obj} />
            ))}
        </>
    )
}

export default function Scene({ canvasId }: { canvasId?: string }) {
  return (
    <div className="absolute inset-0 z-20" key={canvasId}>
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance' // Use dedicated GPU
        }}
        camera={{ position: [0, 0, 5], fov: 75 }}
        frameloop="always" // Ensure continuous rendering
        performance={{ min: 0.5 }} // Adaptive performance
      >
        <Suspense fallback={null}>
            <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}
