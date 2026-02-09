"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface WebcamFeedProps {
  className?: string
}

export default function WebcamFeed({ className }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function setupCamera() {
      try {
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true, // Request microphone permission
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error("Error accessing webcam:", err)
        setError("Could not access camera/microphone. Please allow permissions.")
      }
    }

    setupCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-black", className)}>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white z-50">
          <p>{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
      />
    </div>
  )
}
