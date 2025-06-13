"use client"

import { useEffect, useRef } from "react"

export default function PixelArtNudge() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 200

    // Function to draw a pixel
    const drawPixel = (x: number, y: number, color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }

    // Scale everything up for pixel art
    ctx.imageSmoothingEnabled = false
    ctx.scale(4, 4)

    const colors = {
      background: "#FFECAE",
      person1: "#F17141", // Orange person
      person2: "#4A90E2", // Blue person
      accent: "#2C3E50",
      motion: "#FFB347",
      notification: "#FF6B6B"
    }

    let frame = 0
    const animate = () => {
      frame++

      // Clear canvas
      ctx.fillStyle = colors.background
      ctx.fillRect(0, 0, 100, 50)

      // Animation offset for nudging motion
      const nudgeOffset = Math.sin(frame / 20) * 0.5

      // Draw Person 1 (The Nudger) - Simple abstract figure
      const person1X = 25 + nudgeOffset
      const person1Y = 15

      // Person 1 - Simple rounded head (no face)
      for (let y = person1Y; y < person1Y + 4; y++) {
        for (let x = person1X; x < person1X + 4; x++) {
          drawPixel(x, y, colors.person1)
        }
      }

      // Person 1 - Body (simple rectangle)
      for (let y = person1Y + 4; y < person1Y + 10; y++) {
        for (let x = person1X + 1; x < person1X + 3; x++) {
          drawPixel(x, y, colors.person1)
        }
      }

      // Person 1 - Pointing arm (simple line extending)
      const armLength = Math.sin(frame / 15) * 2 + 4
      for (let x = person1X + 3; x < person1X + 3 + armLength; x++) {
        drawPixel(x, person1Y + 6, colors.person1)
      }

      // Person 1 - Legs (simple lines)
      for (let y = person1Y + 10; y < person1Y + 15; y++) {
        drawPixel(person1X + 1, y, colors.person1)
        drawPixel(person1X + 2, y, colors.person1)
      }

      // Draw Person 2 (The Nudgee) - Simple abstract figure
      const person2X = 60
      const person2Y = 15
      const reactionBounce = Math.sin(frame / 12) * 0.3

      // Person 2 - Simple rounded head (no face)
      for (let y = person2Y - reactionBounce; y < person2Y + 4 - reactionBounce; y++) {
        for (let x = person2X; x < person2X + 4; x++) {
          drawPixel(x, y, colors.person2)
        }
      }

      // Person 2 - Body
      for (let y = person2Y + 4; y < person2Y + 10; y++) {
        for (let x = person2X + 1; x < person2X + 3; x++) {
          drawPixel(x, y, colors.person2)
        }
      }

      // Person 2 - Arms (slightly raised in reaction)
      drawPixel(person2X, person2Y + 5, colors.person2)
      drawPixel(person2X + 3, person2Y + 5, colors.person2)

      // Person 2 - Legs
      for (let y = person2Y + 10; y < person2Y + 15; y++) {
        drawPixel(person2X + 1, y, colors.person2)
        drawPixel(person2X + 2, y, colors.person2)
      }

      // Simple motion indicator - small dots moving between characters
      if (Math.sin(frame / 8) > 0) {
        const motionX = person1X + 8 + Math.sin(frame / 6) * 8
        const motionY = person1Y + 6
        drawPixel(motionX, motionY, colors.motion)
        drawPixel(motionX + 1, motionY, colors.motion)
      }

      // Simple notification indicator above person 2
      if (Math.sin(frame / 10) > 0.7) {
        const notifY = person2Y - 3 + Math.sin(frame / 8) * 1
        drawPixel(person2X + 1, notifY, colors.notification)
        drawPixel(person2X + 2, notifY, colors.notification)
        drawPixel(person2X + 1, notifY + 1, colors.notification)
        drawPixel(person2X + 2, notifY + 1, colors.notification)
      }

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-lg border-2 border-[#F17141] pixelated"
        style={{ imageRendering: "pixelated" }}
      />
      <style jsx>{`
        .pixelated {
          image-rendering: -moz-crisp-edges;
          image-rendering: -webkit-crisp-edges;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  )
} 