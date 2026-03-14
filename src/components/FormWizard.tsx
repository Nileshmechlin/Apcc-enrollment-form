"use client"

import { useState } from "react"
import StudentDetailsForm from "./StudentDetailsForm"
import AgreementView from "./AgreementView"
import SignatureStep from "./SignatureStep"
import SuccessScreen from "./SuccessScreen"

export interface FormData {
  [key: string]: string
}

const STEPS = [
  { label: "Your Details", number: 1 },
  { label: "Agreement", number: 2 },
  { label: "Sign & Submit", number: 3 },
]

export default function FormWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionId, setSubmissionId] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const handleDetailsComplete = (data: FormData) => {
    setFormData(data)
    setCurrentStep(2)
  }

  const handleAgreementAccepted = () => {
    setCurrentStep(3)
  }

  const handleSubmit = async (
    sigDataUrl: string,
    parentSignatureDataUrl?: string,
  ) => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          signatureDataUrl: sigDataUrl,
          ...(parentSignatureDataUrl && { parentSignatureDataUrl }),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Submission failed")
      }

      setSubmissionId(result.submissionId)
      setIsSuccess(true)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewSubmission = () => {
    setCurrentStep(1)
    setFormData({})
    setSubmissionId("")
    setIsSuccess(false)
    setSubmitError("")
  }

  if (isSuccess) {
    return (
      <SuccessScreen
        formData={formData}
        submissionId={submissionId}
        onNewSubmission={handleNewSubmission}
      />
    )
  }

  return (
    <>
      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-steps" data-step={currentStep}>
          {STEPS.map(step => {
            const isCompleted = currentStep > step.number
            const isActive = currentStep === step.number
            return (
              <div key={step.number} className="progress-step">
                <div
                  className={`step-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                  {isCompleted ? "✓" : step.number}
                </div>
                <span
                  className={`step-label ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Card */}
      <div className="form-card" key={currentStep}>
        {currentStep === 1 && (
          <StudentDetailsForm initialData={formData} onNext={handleDetailsComplete} />
        )}
        {currentStep === 2 && (
          <AgreementView onBack={() => setCurrentStep(1)} onAccept={handleAgreementAccepted} />
        )}
        {currentStep === 3 && (
          <SignatureStep
            formData={formData}
            studentName={formData.fullName || ""}
            onBack={() => setCurrentStep(2)}
            onSubmit={handleSubmit}
            error={submitError}
          />
        )}
      </div>

      {/* Submitting overlay */}
      {isSubmitting && (
        <div className="submit-overlay">
          <div className="spinner" />
          <p>Submitting your agreement…</p>
        </div>
      )}
    </>
  )
}
