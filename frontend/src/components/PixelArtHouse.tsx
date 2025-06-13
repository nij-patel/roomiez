"use client"

import { useEffect, useRef } from "react"

export default function PixelArtHouse() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 320
    canvas.height = 240

    // Function to draw a pixel
    const drawPixel = (x: number, y: number, color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }

    // Scale everything up
    ctx.imageSmoothingEnabled = false
    ctx.scale(4, 4)

    // Clear canvas
    ctx.fillStyle = "#FFECAE"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw house
    const colors = {
      outline: "#333333",
      wall: "#F8D775",
      roof: "#F17141",
      window: "#87CEEB",
      windowFrame: "#8B4513",
      door: "#8B4513",
      doorknob: "#FFD700",
      grass: "#7CFC00",
      path: "#D2B48C",
    }

    // Draw grass
    for (let y = 40; y < 60; y++) {
      for (let x = 0; x < 80; x++) {
        if (Math.random() > 0.7) {
          drawPixel(x, y, colors.grass)
        }
      }
    }

    // Draw house walls
    for (let y = 15; y < 40; y++) {
      for (let x = 20; x < 60; x++) {
        drawPixel(x, y, colors.wall)
      }
    }

    // Draw roof
    for (let y = 5; y < 15; y++) {
      for (let x = 15; x < 65; x++) {
        if (x >= 15 + (15 - y) && x < 65 - (15 - y)) {
          drawPixel(x, y, colors.roof)
        }
      }
    }

    // Draw door
    for (let y = 25; y < 40; y++) {
      for (let x = 35; x < 45; x++) {
        drawPixel(x, y, colors.door)
      }
    }

    // Door knob
    for (let y = 32; y < 34; y++) {
      for (let x = 42; x < 44; x++) {
        drawPixel(x, y, colors.doorknob)
      }
    }

    // Draw left window
    for (let y = 20; y < 30; y++) {
      for (let x = 25; x < 33; x++) {
        drawPixel(x, y, colors.window)
      }
    }

    // Window frame
    for (let x = 25; x < 33; x++) {
      drawPixel(x, 20, colors.windowFrame)
      drawPixel(x, 29, colors.windowFrame)
    }
    for (let y = 20; y < 30; y++) {
      drawPixel(25, y, colors.windowFrame)
      drawPixel(32, y, colors.windowFrame)
    }

    // Window divider
    for (let y = 20; y < 30; y++) {
      drawPixel(29, y, colors.windowFrame)
    }
    for (let x = 25; x < 33; x++) {
      drawPixel(x, 25, colors.windowFrame)
    }

    // Draw right window
    for (let y = 20; y < 30; y++) {
      for (let x = 47; x < 55; x++) {
        drawPixel(x, y, colors.window)
      }
    }

    // Window frame
    for (let x = 47; x < 55; x++) {
      drawPixel(x, 20, colors.windowFrame)
      drawPixel(x, 29, colors.windowFrame)
    }
    for (let y = 20; y < 30; y++) {
      drawPixel(47, y, colors.windowFrame)
      drawPixel(54, y, colors.windowFrame)
    }

    // Window divider
    for (let y = 20; y < 30; y++) {
      drawPixel(51, y, colors.windowFrame)
    }
    for (let x = 47; x < 55; x++) {
      drawPixel(x, 25, colors.windowFrame)
    }

    // Draw path
    for (let y = 40; y < 60; y++) {
      for (let x = 35; x < 45; x++) {
        drawPixel(x, y, colors.path)
      }
    }

    // Add some pixel characters (roommates)
    // Character 1
    ctx.fillStyle = "#FF6347" // Tomato color
    ctx.fillRect(30, 45, 3, 5) // Body
    ctx.fillStyle = "#FFD700" // Gold color for head
    ctx.fillRect(30, 43, 3, 2) // Head

    // Character 2
    ctx.fillStyle = "#4682B4" // Steel Blue
    ctx.fillRect(47, 47, 3, 5) // Body
    ctx.fillStyle = "#FFD700" // Gold color for head
    ctx.fillRect(47, 45, 3, 2) // Head

    // Add speech bubbles
    ctx.fillStyle = "white"
    ctx.fillRect(25, 38, 10, 5)
    ctx.fillRect(50, 40, 10, 5)

    // Add pixel text "!" in speech bubbles
    ctx.fillStyle = "#F17141"
    ctx.fillRect(29, 40, 1, 2)
    ctx.fillRect(29, 39, 1, 1)

    ctx.fillRect(54, 42, 1, 2)
    ctx.fillRect(54, 41, 1, 1)

    // Add some animated elements
    let frame = 0
    const animate = () => {
      frame++

      // Clear the animation area
      ctx.fillStyle = "#FFECAE"
      ctx.fillRect(65, 10, 10, 10)

      // Draw a simple sun
      ctx.fillStyle = "#FFD700"
      const sunSize = 5 + Math.sin(frame / 10) * 1
      ctx.beginPath()
      ctx.arc(70, 15, sunSize, 0, Math.PI * 2)
      ctx.fill()

      // Draw some birds
      ctx.fillStyle = "#333"
      const birdX = (frame % 100) / 2
      ctx.fillRect(birdX, 10, 1, 1)
      ctx.fillRect(birdX + 2, 10, 1, 1)
      ctx.fillRect(birdX + 1, 11, 1, 1)

      ctx.fillRect(birdX - 10, 8, 1, 1)
      ctx.fillRect(birdX - 8, 8, 1, 1)
      ctx.fillRect(birdX - 9, 9, 1, 1)

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-lg border-4 border-[#F17141] pixelated"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  )
} 