/**
 * Agreement Configuration
 *
 * Matches the Provisional Membership Enrollment Agreement.
 * Sections with csrTableOnPdf are shown to the student as text only;
 * the table (e.g. item 7) is rendered on the PDF for CSR to fill.
 */

export const agreementConfig = {
  title: "Provisional Membership Enrollment Agreement",
  subtitle: "Accelerated Pathways Career College",
  lastUpdated: "",
  /** If true, student view shows only the section text; PDF also renders the CSR table. */
  sections: [
    {
      heading: "1. Scope and Eligibility",
      content:
        "Under this promotional tuition model option, available only to new students, instructional access costs are covered by a monthly membership payment of $99 USD instead of traditional lump-sum or installment-based tuition.\n\n" +
        "This tuition option is strictly limited to new students and has a limited number of membership slots: the offer will be extended only to the first one hundred (100) applicants who apply and enroll via Career Membership tuition option. Additionally, eligible applicants must meet all standard institutional admissions requirements, submit required documentation, and sign their enrollment agreement.\n\n" +
        "Placements within the 100-student limit are determined by the availability of membership slots, having a fully completed enrollment packet, and establishing a recurring payment method for the monthly payment of the $99 membership fee.",
    },
    {
      heading: "2. Services Included in Membership",
      content:
        "The Career Membership tuition option provides access to all of APCC's comprehensive and fast-track programs, which include (but are not limited to) programs such as Medical Assistant, Paralegal, Phlebotomy Technician, EKG Technician, Medical Billing and Coding, and Medical Receptionist, among other programs offered by the Institution as long as the student's membership is active. In addition to classes and instructional materials, member students also receive the benefit of access to use:\n" +
        "➔ Institutional learning platforms\n" +
        "➔ Labs\n" +
        "➔ Simulations\n" +
        "➔ Facilities and school amenities\n" +
        "➔ Externship coordination\n" +
        "➔ Preparation for national certification exams",
    },
    {
      heading: "3. Services and Products Not Covered",
      content:
        "Per the Institution's terms and conditions, all other non-instructional costs will remain the student's responsibility. These include, but are not limited to:\n" +
        "➔ Textbooks\n" +
        "➔ Student supplies and class materials\n" +
        "➔ Uniforms\n" +
        "➔ Background checks\n" +
        "➔ Drug screenings\n" +
        "➔ Immunizations\n" +
        "➔ Third-party exam fees",
    },
    {
      heading: "4. Payment Terms",
      content:
        "Monthly membership payments of $99 USD per month must remain current, as missed or late payments may result in:\n" +
        "a) suspension of instructional access,\n" +
        "b) inability to participate in labs or externships,\n" +
        "c) administrative withdrawal, or\n" +
        "d) removal from the Career Membership tuition option program",
    },
    {
      heading: "5. Refund Policy",
      content:
        "Refunds for Career Membership-enrolled students will follow APCC's standard refund policy and applicable state regulations. Membership fee payments already collected are treated as tuition payments for refund-calculation purposes, and any refundable amount is determined based on the student's withdrawal date, documented instruction received, and the institutional refund schedule published in the catalog.\n\n" +
        "Non-instructional charges (books, supplies, uniforms, background checks, drug screens, third-party fees, etc.) are not refundable once incurred.\n\n" +
        "Refunds are issued only after formal withdrawal or administrative drop and completion of all refund calculations by the Financial Officer.",
    },
    {
      heading: "6. Program Completion and Continued Membership",
      content:
        "Upon program completion, students may graduate, complete national certification steps, and receive their certificate of completion. After completion of their desired program(s), students may cancel their membership according to institutional policy, or continue membership if they wish to pursue additional offerings available at that time. Withdrawal, cancellation, or termination of Memberships follows APCC's standard procedures and will affect eligibility if the student later seeks re-enrollment.",
    },
    {
      heading: "7. Student Responsibilities",
      content:
        "Maintain good academic standing and follow all APCC attendance, conduct, and institutional policies. Maintain active membership payments to retain access to services.",
      /** Table (Start Date, Starting Program, Tuition, Notes) is CSR-only; rendered on PDF only. */
      csrTableOnPdf: true,
    },
    {
      heading: "8. Institutional Rights",
      content:
        "APCC reserves the right to discontinue or modify this promotion for future applicants, provided such changes do not alter the terms for students already enrolled under the existing promotional Membership Program.",
    },
    {
      heading: "9. Whole Agreement Acknowledgment",
      content:
        "By signing, the Student confirms they have read, understand, and agree to all terms of this Enrollment Agreement.",
    },
    {
      heading: "10. Disclaimer",
      content:
        "This document is provided solely for provisional use and should not be regarded as a final. Its terms contained are intended to guide interim understanding and may be subject to change. Upon the execution of the next official enrollment agreement, this document will automatically be rendered null and without effect.",
    },
  ],
}
