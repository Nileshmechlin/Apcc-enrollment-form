import FormWizard from "@/components/FormWizard"
import Image from "next/image"
import logo from "@/APCC-Logo.png"

export default function Home() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-icon" style={{ overflow: "hidden" }}>
          <Image src={logo} alt="APCC Logo" width={64} height={64} />
        </div>
        <h1>Student Agreement Form</h1>
        <p>Please complete all steps to digitally sign the agreement</p>
      </header>
      <FormWizard />
    </div>
  )
}
