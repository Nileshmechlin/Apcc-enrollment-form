export interface FormField {
  name: string
  label: string
  type: "text" | "email" | "tel" | "date" | "select"
  required: boolean
  placeholder: string
  options?: string[] // For select type
  autoFill?: "date" // Auto-fill with current date
  /** When true, field is only shown when the student is a minor (under 18). */
  showWhenMinor?: boolean
}

/**
 * Configure the form fields here.
 * Add, remove, or modify fields as needed.
 * The form will render these fields dynamically.
 */
export const formFields: FormField[] = [
  {
    name: "fullName",
    label: "Full Name",
    type: "text",
    required: true,
    placeholder: "Enter your full name",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    required: true,
    placeholder: "Enter your email address",
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "tel",
    required: true,
    placeholder: "(555) 555-5555",
  },
  {
    name: "date",
    label: "Date",
    type: "date",
    required: true,
    placeholder: "",
    autoFill: "date",
  },
  {
    name: "dateOfBirth",
    label: "Date of Birth",
    type: "date",
    required: true,
    placeholder: "",
  },
  {
    name: "parentsName",
    label: "Parent's Name",
    type: "text",
    required: false,
    placeholder: "Full name of parent or guardian",
    showWhenMinor: true,
  },
]
