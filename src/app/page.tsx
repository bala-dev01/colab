import WebcamFeed from "@/components/vision/WebcamFeed"
import HandTracker from "@/components/vision/HandTracker"
import Scene from "@/components/canvas/Scene"
import ChatOverlay from "@/components/interface/ChatOverlay"
import TwoHandIndicator from "@/components/interface/TwoHandIndicator"
import CanvasManager from "@/components/interface/CanvasManager"
import AirWritingCanvas from "@/components/vision/AirWritingCanvas"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="relative w-screen h-screen bg-black overflow-hidden">
        {/* Logic Layer: Headless Components */}
        <HandTracker />

        {/* Layer 1: Video Feed */}
        <div className="absolute inset-0 z-0">
          <WebcamFeed />
        </div>

        {/* Layer 2: 3D Spatial Overlay */}
        <Scene />
        
        {/* Layer 2.5: Air Writing Canvas */}
        <AirWritingCanvas />

        {/* Layer 3: UI Overlay (HUD) */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="p-8 text-white">
            <h1 className="text-4xl font-bold tracking-tighter opacity-50">GHOST CANVAS</h1>
             <p className="text-sm opacity-70">Gemini 3 Hackathon Build</p>
          </div>
          
          {/* Canvas Manager - pointer events enabled */}
          <div className="pointer-events-auto">
            <CanvasManager />
          </div>
          
          {/* Two-Hand Gesture Indicator */}
          <TwoHandIndicator />
          
          {/* Interactive Chat - pointer events enabled for this child */}
          <div className="pointer-events-auto">
             <ChatOverlay />
          </div>
        </div>
      </div>
    </main>
  )
}
