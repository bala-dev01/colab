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
  const setTwoHandState = useStore((state) => state.setTwoHandState)

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
          numHands: 2, // Track both hands for two-hand gestures
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
            // Process first hand (primary hand for single-hand gestures)
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
            
            // Update primary hand state
            setHand({
                x: 1 - indexTip.x, // Mirror flip for cursor coordination
                y: indexTip.y,     // Y is standard (0 top, 1 bottom)
                z: indexTip.z || 0,
                isPresent: true,
                isPinching,
                isPointing: false  // Not needed without air writing
            })
            
            // TWO-HAND GESTURE DETECTION
            if (results.landmarks.length >= 2) {
                const hand1 = results.landmarks[0]
                const hand2 = results.landmarks[1]
                
                // Get pinch points for both hands (index tip)
                const hand1IndexTip = hand1[8]
                const hand2IndexTip = hand2[8]
                const hand1ThumbTip = hand1[4]
                const hand2ThumbTip = hand2[4]
                
                // Check if both hands are pinching
                const hand1Distance = Math.sqrt(
                    Math.pow(hand1IndexTip.x - hand1ThumbTip.x, 2) + 
                    Math.pow(hand1IndexTip.y - hand1ThumbTip.y, 2)
                )
                const hand2Distance = Math.sqrt(
                    Math.pow(hand2IndexTip.x - hand2ThumbTip.x, 2) + 
                    Math.pow(hand2IndexTip.y - hand2ThumbTip.y, 2)
                )
                
                const hand1Pinching = hand1Distance < PINCH_THRESHOLD
                const hand2Pinching = hand2Distance < PINCH_THRESHOLD
                const bothPinching = hand1Pinching && hand2Pinching
                
                // Calculate distance between hands (for scaling)
                const twoHandDistance = Math.sqrt(
                    Math.pow(hand1IndexTip.x - hand2IndexTip.x, 2) + 
                    Math.pow(hand1IndexTip.y - hand2IndexTip.y, 2) +
                    Math.pow(hand1IndexTip.z - hand2IndexTip.z, 2)
                )
                
                // Determine which hand is left/right based on x position
                const leftHand = hand1IndexTip.x < hand2IndexTip.x ? hand1 : hand2
                const rightHand = hand1IndexTip.x < hand2IndexTip.x ? hand2 : hand1
                
                setTwoHandState({
                    leftHand: {
                        x: 1 - leftHand[8].x,
                        y: leftHand[8].y,
                        z: leftHand[8].z,
                        isPresent: true,
                        isPinching: hand1IndexTip.x < hand2IndexTip.x ? hand1Pinching : hand2Pinching,
                        isPointing: false
                    },
                    rightHand: {
                        x: 1 - rightHand[8].x,
                        y: rightHand[8].y,
                        z: rightHand[8].z,
                        isPresent: true,
                        isPinching: hand1IndexTip.x < hand2IndexTip.x ? hand2Pinching : hand1Pinching,
                        isPointing: false
                    },
                    isTwoHandPinching: bothPinching,
                    twoHandDistance: twoHandDistance
                })
            } else {
                // Only one hand detected, clear two-hand state
                setTwoHandState({
                    leftHand: null,
                    rightHand: null,
                    isTwoHandPinching: false,
                    twoHandDistance: 0
                })
            }
         } else {
             setHand({ isPresent: false })
             setTwoHandState({
                 leftHand: null,
                 rightHand: null,
                 isTwoHandPinching: false,
                 twoHandDistance: 0
             })
         }
      }
    }
    requestRef.current = requestAnimationFrame(processVideo)
  }

  return null // Headless component
}
