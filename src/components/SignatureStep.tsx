"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import SignaturePad from "signature_pad"
import type { FormData } from "./FormWizard"

function isMinor(dateOfBirthStr: string | undefined): boolean {
  if (!dateOfBirthStr?.trim()) return false
  const birth = new Date(dateOfBirthStr)
  if (isNaN(birth.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age < 18
}

interface Props {
  formData: FormData
  studentName: string
  onBack: () => void
  onSubmit: (signatureDataUrl: string, parentSignatureDataUrl?: string) => void
  error: string
}

type SignatureMode = "draw" | "type"

export default function SignatureStep({
  formData,
  studentName,
  onBack,
  onSubmit,
  error,
}: Props) {
  const isMinorStudent = isMinor(formData.dateOfBirth)
  const parentNameValid = !isMinorStudent || !!formData.parentsName?.trim()

  const [mode, setMode] = useState<SignatureMode>("draw")
  const [typedSignature, setTypedSignature] = useState("")
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)

  const [parentMode, setParentMode] = useState<SignatureMode>("draw")
  const [parentTypedSignature, setParentTypedSignature] = useState("")
  const [parentHasDrawnSignature, setParentHasDrawnSignature] = useState(false)
  const parentCanvasRef = useRef<HTMLCanvasElement>(null)
  const parentSignaturePadRef = useRef<SignaturePad | null>(null)

  // Initialize signature pad
  useEffect(() => {
    if (mode !== "draw" || !canvasRef.current) return

    const canvas = canvasRef.current
    const parent = canvas.parentElement
    if (!parent) return

    // Set canvas size
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = parent.offsetWidth * ratio
    canvas.height = 200 * ratio
    canvas.style.width = `${parent.offsetWidth}px`
    canvas.style.height = "200px"

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(ratio, ratio)
    }

    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgba(0, 0, 0, 0)",
      penColor: "#000000",
      minWidth: 1.5,
      maxWidth: 3,
    })

    pad.addEventListener("endStroke", () => {
      setHasDrawnSignature(!pad.isEmpty())
    })

    signaturePadRef.current = pad

    return () => {
      pad.off()
    }
  }, [mode])

  // Handle window resize for canvas
  useEffect(() => {
    const handleResize = () => {
      if (mode !== "draw" || !canvasRef.current || !signaturePadRef.current) return
      const canvas = canvasRef.current
      const parent = canvas.parentElement
      if (!parent) return

      const data = signaturePadRef.current.toData()
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = parent.offsetWidth * ratio
      canvas.height = 200 * ratio
      canvas.style.width = `${parent.offsetWidth}px`
      canvas.style.height = "200px"

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(ratio, ratio)
      }

      signaturePadRef.current.fromData(data)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mode])

  // Initialize parent signature pad (when minor)
  useEffect(() => {
    if (!isMinorStudent || parentMode !== "draw" || !parentCanvasRef.current) return
    const canvas = parentCanvasRef.current
    const parentEl = canvas.parentElement
    if (!parentEl) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = parentEl.offsetWidth * ratio
    canvas.height = 200 * ratio
    canvas.style.width = `${parentEl.offsetWidth}px`
    canvas.style.height = "200px"
    const ctx = canvas.getContext("2d")
    if (ctx) ctx.scale(ratio, ratio)
    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgba(0, 0, 0, 0)",
      penColor: "#000000",
      minWidth: 1.5,
      maxWidth: 3,
    })
    pad.addEventListener("endStroke", () => setParentHasDrawnSignature(!pad.isEmpty()))
    parentSignaturePadRef.current = pad
    return () => {
      pad.off()
    }
  }, [isMinorStudent, parentMode])

  const clearParentSignature = useCallback(() => {
    if (parentMode === "draw" && parentSignaturePadRef.current) {
      parentSignaturePadRef.current.clear()
      setParentHasDrawnSignature(false)
    } else {
      setParentTypedSignature("")
    }
  }, [parentMode])

  const clearSignature = useCallback(() => {
    if (mode === "draw" && signaturePadRef.current) {
      signaturePadRef.current.clear()
      setHasDrawnSignature(false)
    } else {
      setTypedSignature("")
    }
  }, [mode])

  const getSignatureDataUrl = (): string | null => {
    if (mode === "draw") {
      if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
        return null
      }
      return signaturePadRef.current.toDataURL("image/png")
    } else {
      if (!typedSignature.trim()) return null
      // Generate a data URL from typed text using canvas
      const canvas = document.createElement("canvas")
      canvas.width = 600
      canvas.height = 150
      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      ctx.fillStyle = "transparent"
      ctx.fillRect(0, 0, 600, 150)
      ctx.font = "48px Caveat, cursive"
      ctx.fillStyle = "#000000"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(typedSignature, 300, 75)

      return canvas.toDataURL("image/png")
    }
  }

  const getParentSignatureDataUrl = (): string | null => {
    if (parentMode === "draw") {
      if (!parentSignaturePadRef.current || parentSignaturePadRef.current.isEmpty()) return null
      return parentSignaturePadRef.current.toDataURL("image/png")
    }
    if (!parentTypedSignature.trim()) return null
    const canvas = document.createElement("canvas")
    canvas.width = 600
    canvas.height = 150
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.fillStyle = "transparent"
    ctx.fillRect(0, 0, 600, 150)
    ctx.font = "48px Caveat, cursive"
    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(parentTypedSignature, 300, 75)
    return canvas.toDataURL("image/png")
  }

  const handleSubmit = () => {
    const dataUrl = getSignatureDataUrl()
    if (!dataUrl) return
    if (isMinorStudent) {
      if (!formData.parentsName?.trim()) return
      const parentUrl = getParentSignatureDataUrl()
      if (!parentUrl) return
      onSubmit(dataUrl, parentUrl)
    } else {
      onSubmit(dataUrl)
    }
  }

  const studentValid = mode === "draw" ? hasDrawnSignature : typedSignature.trim().length > 0
  const parentValid =
    !isMinorStudent ||
    (parentMode === "draw" ? parentHasDrawnSignature : parentTypedSignature.trim().length > 0)
  const isValid = studentValid && parentValid && parentNameValid

  return (
    <div>
      <h2 className="form-card-title">Sign the Agreement</h2>
      <p className="form-card-subtitle">
        Provide your digital signature by drawing or typing your name below.
      </p>

      {/* Mode Toggle */}
      <div className="signature-mode-toggle">
        <button
          type="button"
          className={`signature-mode-btn ${mode === "draw" ? "active" : ""}`}
          onClick={() => setMode("draw")}>
          Draw Signature
        </button>
        <button
          type="button"
          className={`signature-mode-btn ${mode === "type" ? "active" : ""}`}
          onClick={() => setMode("type")}>
          Type Signature
        </button>
      </div>

      {/* Draw Mode */}
      {mode === "draw" && (
        <>
          <div className="signature-canvas-wrapper">
            <canvas ref={canvasRef} />
            <div className={`signature-canvas-placeholder ${hasDrawnSignature ? "hidden" : ""}`}>
              <span>Draw your signature here</span>
            </div>
          </div>
          <div className="signature-actions">
            <button type="button" className="btn btn-ghost" onClick={clearSignature}>
              Clear
            </button>
          </div>
        </>
      )}

      {/* Type Mode */}
      {mode === "type" && (
        <>
          <input
            type="text"
            className="signature-typed-input"
            placeholder="Type your full name..."
            value={typedSignature}
            onChange={e => setTypedSignature(e.target.value)}
            autoFocus
          />
          {typedSignature && (
            <div className="signature-preview">
              <p>Signature Preview</p>
              <div className="preview-name">{typedSignature}</div>
            </div>
          )}
          <div className="signature-actions">
            <button type="button" className="btn btn-ghost" onClick={clearSignature}>
              Clear
            </button>
          </div>
        </>
      )}

      {/* Signer info */}
      <div className="signature-preview" style={{ marginBottom: "0" }}>
        <p>Signing as</p>
        <div className="detail-value">{studentName}</div>
        <p style={{ marginTop: "4px" }}>
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Parent/Guardian Signature (only when minor) */}
      {isMinorStudent && (
        <div
          className="signature-block"
          style={{
            marginTop: "28px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border-color, #e5e7eb)",
          }}>
          <h3 className="form-card-title" style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
            Parent/Guardian Signature
          </h3>
          <p className="form-card-subtitle" style={{ marginBottom: "16px" }}>
            As the student is under 18, a parent or guardian must sign below.
            {formData.parentsName && (
              <span className="detail-value" style={{ display: "block", marginTop: "4px" }}>
                Signing as: {formData.parentsName}
              </span>
            )}
            {!formData.parentsName?.trim() && (
              <span
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "var(--error-color)",
                  fontWeight: 600,
                }}>
                Parent/Guardian name is required (go back and fill it in).
              </span>
            )}
          </p>
          <div className="signature-mode-toggle">
            <button
              type="button"
              className={`signature-mode-btn ${parentMode === "draw" ? "active" : ""}`}
              onClick={() => setParentMode("draw")}>
              Draw Signature
            </button>
            <button
              type="button"
              className={`signature-mode-btn ${parentMode === "type" ? "active" : ""}`}
              onClick={() => setParentMode("type")}>
              Type Signature
            </button>
          </div>
          {parentMode === "draw" && (
            <>
              <div className="signature-canvas-wrapper">
                <canvas ref={parentCanvasRef} />
                <div
                  className={`signature-canvas-placeholder ${parentHasDrawnSignature ? "hidden" : ""}`}>
                  <span>Parent/guardian: draw your signature here</span>
                </div>
              </div>
              <div className="signature-actions">
                <button type="button" className="btn btn-ghost" onClick={clearParentSignature}>
                  Clear
                </button>
              </div>
            </>
          )}
          {parentMode === "type" && (
            <>
              <input
                type="text"
                className="signature-typed-input"
                placeholder="Type parent/guardian full name..."
                value={parentTypedSignature}
                onChange={e => setParentTypedSignature(e.target.value)}
              />
              {parentTypedSignature && (
                <div className="signature-preview">
                  <p>Signature Preview</p>
                  <div className="preview-name">{parentTypedSignature}</div>
                </div>
              )}
              <div className="signature-actions">
                <button type="button" className="btn btn-ghost" onClick={clearParentSignature}>
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="error-message"
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "var(--error-bg)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}>
          ⚠ {error}
        </div>
      )}

      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!isValid}
          onClick={handleSubmit}>
          Submit & Sign
        </button>
      </div>
    </div>
  )
}
