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
    placeholder: "Enter your phone number",
  },
  {
    name: "address",
    label: "Address",
    type: "text",
    required: true,
    placeholder: "Street address, City, State, ZIP code",
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
    name: "emergencyName",
    label: "Emergency Contact Name",
    type: "text",
    required: true,
    placeholder: "Full name",
  },
  {
    name: "emergencyRelationship",
    label: "Relationship",
    type: "text",
    required: true,
    placeholder: "e.g. Parent, Spouse",
  },
  {
    name: "emergencyPhone",
    label: "Emergency Phone",
    type: "tel",
    required: true,
    placeholder: "Emergency contact number",
  },
  {
    name: "medicalConditions",
    label: "Medical Conditions / Special Considerations",
    type: "text",
    required: false,
    placeholder: "Allergies, medications, etc. (Optional)",
  },
  {
    name: "highSchoolDiploma",
    label: "Do you have a High School Diploma or equivalent (GED)?",
    type: "select",
    required: true,
    options: ["Yes", "No"],
    placeholder: "Select...",
  },
  {
    name: "initials",
    label: "Student Initials (Signature for each page)",
    type: "text",
    required: true,
    placeholder: "e.g. JD",
  },
  {
    name: "parent1Name",
    label: "1st Parent/Guardian Name",
    type: "text",
    required: false,
    placeholder: "Required if student is a minor",
    showWhenMinor: true,
  },
  {
    name: "parent1Address",
    label: "1st Parent Address",
    type: "text",
    required: false,
    placeholder: "Address of 1st parent",
    showWhenMinor: true,
  },
  {
    name: "parent1Phone",
    label: "1st Parent Phone",
    type: "tel",
    required: false,
    placeholder: "Phone of 1st parent",
    showWhenMinor: true,
  },
  {
    name: "parent1Email",
    label: "1st Parent Email",
    type: "email",
    required: false,
    placeholder: "Email of 1st parent",
    showWhenMinor: true,
  },
  {
    name: "parent2Name",
    label: "2nd Parent/Guardian Name",
    type: "text",
    required: false,
    placeholder: "Full name (Optional)",
    showWhenMinor: true,
  },
  {
    name: "parent2Address",
    label: "2nd Parent Address",
    type: "text",
    required: false,
    placeholder: "Address of 2nd parent",
    showWhenMinor: true,
  },
  {
    name: "parent2Phone",
    label: "2nd Parent Phone",
    type: "tel",
    required: false,
    placeholder: "Phone of 2nd parent",
    showWhenMinor: true,
  },
  {
    name: "parent2Email",
    label: "2nd Parent Email",
    type: "email",
    required: false,
    placeholder: "Email of 2nd parent",
    showWhenMinor: true,
  },
]
