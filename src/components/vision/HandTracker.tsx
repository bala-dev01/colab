"use client"

import { useEffect, useRef } from "react"
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision"
import { useStore } from "@/lib/store"

// Constants for gesture detection
const PINCH_THRESHOLD = 0.06 // Trigger pinch
const RELEASE_THRESHOLD = 0.08 // Release pinch (hysteresis to prevent flickering)

export default function HandTracker() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastVideoTimeRef = useRef<number>(-1)
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)
  const requestRef = useRef<number>(0)
  
  const setHand = useStore((state) => state.setHand)

  useEffect(() => {
    async function setupHandLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        )
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        })
        handLandmarkerRef.current = handLandmarker
        
        // Start processing once the model is ready
        startProcessing()
      } catch (err) {
        console.error("Error initializing MediaPipe:", err)
      }
    }

    setupHandLandmarker()

    return () => {
      cancelAnimationFrame(requestRef.current)
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startProcessing = () => {
    // Find the video element from the DOM (created by WebcamFeed) - messy but effective for decoupled components
    // Ideally, we'd pass the ref, but for now we look for the <video> tag
    const videoElement = document.querySelector("video")
    if (videoElement) {
        videoRef.current = videoElement
        processVideo()
    } else {
        // Retry if video not yet mounted
        requestRef.current = requestAnimationFrame(startProcessing)
    }
  }

  const processVideo = () => {
    if (videoRef.current && handLandmarkerRef.current) {
      const video = videoRef.current
        
      if (video.videoWidth > 0 && video.currentTime !== lastVideoTimeRef.current) {
         lastVideoTimeRef.current = video.currentTime
         
         const results = handLandmarkerRef.current.detectForVideo(video, performance.now())
         
         if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0]
            
            // Index Tip (8)
            const indexTip = landmarks[8]
            // Thumb Tip (4)
            const thumbTip = landmarks[4]
            
            // Calculate distance for pinch
            const distance = Math.sqrt(
                Math.pow(indexTip.x - thumbTip.x, 2) + 
                Math.pow(indexTip.y - thumbTip.y, 2)
            )
            
            // Hysteresis for pinch detection
            const currentPinchState = useStore.getState().hand.isPinching
            let isPinching = currentPinchState

            if (distance < PINCH_THRESHOLD) {
                isPinching = true
            } else if (distance > RELEASE_THRESHOLD) {
                isPinching = false
            }
            
            // Update Store
            // MediaPipe: x calls from 0 (left) to 1 (right)
            // But we mirrored the video with CSS scale-x-[-1], so visually it matches.
            // HOWEVER, the logic operates on the raw stream. 
            // If the user moves their RIGHT hand (on the right side of their body), 
            // it appears on the LEFT of the screen (mirror).
            // MediaPipe sees it at x ~ 0.8 (raw). 
            // We want our virtual cursor to be at x ~ 0.2 (visual).
            // So we need to flip X for the store if we want to align with the visual mirror.
            
            setHand({
                isPresent: true,
                x: 1 - indexTip.x, // Mirror flip for cursor coordination
                y: indexTip.y,     // Y is standard (0 top, 1 bottom)
                z: indexTip.z,
                isPinching: isPinching
            })
         } else {
             setHand({ isPresent: false })
         }
      }
    }
    requestRef.current = requestAnimationFrame(processVideo)
  }

  return null // Headless component
}
