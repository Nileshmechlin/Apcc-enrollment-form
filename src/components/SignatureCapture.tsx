"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import SignaturePad from "signature_pad"

interface Props {
  onCapture: (dataUrl: string) => void
}

type Mode = "draw" | "type"

/**
 * Reusable signature capture component — used by both the student flow and
 * the admin approval flow. Calls onCapture whenever the signature changes.
 */
export default function SignatureCapture({ onCapture }: Props) {
  const [mode, setMode] = useState<Mode>("draw")
  const [typedName, setTypedName] = useState("")
  const [hasDrawn, setHasDrawn] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)

  // Notify parent whenever signature changes
  const emitSignature = useCallback(
    (pad?: SignaturePad) => {
      const activePad = pad ?? padRef.current
      if (mode === "draw") {
        if (activePad && !activePad.isEmpty()) {
          onCapture(activePad.toDataURL("image/png"))
        }
      } else {
        if (typedName.trim()) {
          const canvas = document.createElement("canvas")
          canvas.width = 600
          canvas.height = 150
          const ctx = canvas.getContext("2d")
          if (!ctx) return
          ctx.fillStyle = "transparent"
          ctx.fillRect(0, 0, 600, 150)
          ctx.font = "48px Caveat, cursive"
          ctx.fillStyle = "#000000"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(typedName, 300, 75)
          onCapture(canvas.toDataURL("image/png"))
        }
      }
    },
    [mode, typedName, onCapture],
  )

  useEffect(() => {
    if (typedName.trim()) emitSignature()
  }, [typedName, emitSignature])

  useEffect(() => {
    if (mode !== "draw" || !canvasRef.current) return
    const canvas = canvasRef.current
    const parent = canvas.parentElement
    if (!parent) return

    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = parent.offsetWidth * ratio
    canvas.height = 160 * ratio
    canvas.style.width = `${parent.offsetWidth}px`
    canvas.style.height = "160px"

    const ctx = canvas.getContext("2d")
    if (ctx) ctx.scale(ratio, ratio)

    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgba(0,0,0,0)",
      penColor: "#000000",
      minWidth: 1.5,
      maxWidth: 3,
    })

    pad.addEventListener("endStroke", () => {
      const empty = pad.isEmpty()
      setHasDrawn(!empty)
      if (!empty) emitSignature(pad)
    })

    padRef.current = pad
    return () => {
      pad.off()
    }
  }, [mode, emitSignature])

  const clear = () => {
    if (mode === "draw") {
      padRef.current?.clear()
      setHasDrawn(false)
    } else {
      setTypedName("")
    }
  }

  return (
    <div>
      {/* Mode Toggle */}
      <div className="signature-mode-toggle">
        {(["draw", "type"] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            className={`signature-mode-btn ${mode === m ? "active" : ""}`}
            onClick={() => setMode(m)}>
            {m === "draw" ? "Draw Signature" : "Type Signature"}
          </button>
        ))}
      </div>

      {mode === "draw" && (
        <>
          <div className="signature-canvas-wrapper">
            <canvas ref={canvasRef} />
            <div className={`signature-canvas-placeholder ${hasDrawn ? "hidden" : ""}`}>
              <span>Draw your signature here</span>
            </div>
          </div>
          <div className="signature-actions">
            <button type="button" className="btn btn-ghost" onClick={clear}>
              Clear
            </button>
          </div>
        </>
      )}

      {mode === "type" && (
        <>
          <input
            type="text"
            className="signature-typed-input"
            placeholder="Type your full name…"
            value={typedName}
            onChange={e => setTypedName(e.target.value)}
            autoFocus
          />
          {typedName && (
            <div className="signature-preview">
              <p>Signature Preview</p>
              <div className="preview-name">{typedName}</div>
            </div>
          )}
          <div className="signature-actions">
            <button type="button" className="btn btn-ghost" onClick={clear}>
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  )
}
