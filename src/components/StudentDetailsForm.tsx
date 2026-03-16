"use client"

import { useState, useEffect } from "react"
import { formFields, type FormField } from "@/config/formFields"
import type { FormData } from "./FormWizard"
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input"

interface Props {
  initialData: FormData
  onNext: (data: FormData) => void
}

export default function StudentDetailsForm({ initialData, onNext }: Props) {
  const [data, setData] = useState<FormData>({ ...initialData })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-fill date field
  useEffect(() => {
    formFields.forEach(field => {
      if (field.autoFill === "date" && !data[field.name]) {
        setData(prev => ({
          ...prev,
          [field.name]: new Date().toISOString().split("T")[0],
        }))
      }
    })
  }, [])

  const handleChange = (name: string, value: string) => {
    setData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
  }

  const isMinor = (dateOfBirthStr: string | undefined): boolean => {
    if (!dateOfBirthStr?.trim()) return false
    const birth = new Date(dateOfBirthStr)
    if (isNaN(birth.getTime())) return false
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age < 18
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    const minor = isMinor(data.dateOfBirth)

    formFields.forEach(field => {
      if (field.showWhenMinor && !minor) return
      const value = data[field.name]?.trim() || ""
      const required = field.required || (field.showWhenMinor && minor)

      if (required && !value) {
        newErrors[field.name] = `${field.label} is required`
      }

      if (field.type === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          newErrors[field.name] = "Please enter a valid email address"
        }
      }

      if (field.type === "tel" && value) {
        // Store phone in E.164 format via PhoneInput; validate internationally
        if (!isValidPhoneNumber(value)) {
          newErrors[field.name] = "Please enter a valid phone number"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateStudentId = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `STU-${timestamp}-${random}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      // Append generated Student ID if not already present
      const submissionData = { ...data }
      if (!submissionData.studentId) {
        submissionData.studentId = generateStudentId()
      }
      onNext(submissionData)
    }
  }

  const renderField = (field: FormField) => {
    if (field.type === "select" && field.options) {
      return (
        <select
          id={field.name}
          value={data[field.name] || ""}
          onChange={e => handleChange(field.name, e.target.value)}>
          <option value="">{field.placeholder || "Select..."}</option>
          {field.options.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === "tel") {
      return (
        <PhoneInput
          id={field.name}
          international
          defaultCountry={undefined}
          value={data[field.name] || ""}
          onChange={v => handleChange(field.name, v || "")}
          placeholder={field.placeholder}
          className={`phone-input ${errors[field.name] ? "error" : ""}`}
        />
      )
    }

    return (
      <input
        id={field.name}
        type={field.type}
        value={data[field.name] || ""}
        onChange={e => handleChange(field.name, e.target.value)}
        placeholder={field.placeholder}
        className={errors[field.name] ? "error" : ""}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="form-card-title">Your Details</h2>
      <p className="form-card-subtitle">
        Please fill in your information below. Fields marked with * are required.
      </p>

      <div className="form-grid">
        {formFields
          .filter(field => !field.showWhenMinor || isMinor(data.dateOfBirth))
          .map(field => (
            <div
              key={field.name}
              className={`form-group ${field.name === "parentsName" ? "full-width" : ""}`}>
              <label htmlFor={field.name}>
                {field.label}
                {(field.required || (field.showWhenMinor && isMinor(data.dateOfBirth))) && (
                  <span className="required">*</span>
                )}
              </label>
              {renderField(field)}
              {errors[field.name] && (
                <span className="error-message">⚠ {errors[field.name]}</span>
              )}
            </div>
          ))}
      </div>

      <div className="button-row" style={{ justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-primary">
          Continue →
        </button>
      </div>
    </form>
  )
}
