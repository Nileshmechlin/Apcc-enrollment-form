'use client';

import { useState, useRef, useEffect } from 'react';
import { agreementConfig } from '@/config/agreement';
import Image from 'next/image';
import logo from '@/APCC-Logo.png';

interface Props {
  onBack: () => void;
  onAccept: () => void;
  formData: Record<string, string>;
}

/** Renders agreement section content: paragraphs, ➔ bullets, and a) b) c) d) lettered lines. */
function AgreementSectionContent({ content, formData }: { content: string; formData: Record<string, string> }) {
  // Replace placeholders [fieldName] with actual values (case-insensitive)
  let resolvedContent = content;
  if (formData) {
    Object.entries(formData).forEach(([key, value]) => {
      // Create a regex that matches [key] case-insensitively
      const regex = new RegExp(`\\[${key}\\]`, 'gi');
      resolvedContent = resolvedContent.replace(regex, value || `[${key}]`);
    });
  }

  const lines = resolvedContent.split('\n');
  const blocks: { type: 'para' | 'bullet' | 'lettered'; lines: string[] }[] = [];
  let current: { type: 'para' | 'bullet' | 'lettered'; lines: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const isBullet = /^➔\s*/.test(trimmed) || (/^[•\-]\s*/.test(trimmed));
    const isLettered = /^[a-d]\)\s/.test(trimmed);

    if (isBullet) {
      if (current?.type !== 'bullet') {
        current = { type: 'bullet', lines: [] };
        blocks.push(current);
      }
      current.lines.push(trimmed.replace(/^➔\s*/, '').trim());
    } else if (isLettered) {
      if (current?.type !== 'lettered') {
        current = { type: 'lettered', lines: [] };
        blocks.push(current);
      }
      current.lines.push(trimmed);
    } else {
      if (trimmed === '') {
        current = null;
        continue;
      }
      if (current?.type !== 'para') {
        current = { type: 'para', lines: [] };
        blocks.push(current);
      }
      current.lines.push(trimmed);
    }
  }

  return (
    <div className="agreement-section-content">
      {blocks.map((block, i) => {
        if (block.type === 'para') {
          return (
            <p key={i} className="agreement-para">
              {block.lines.join(' ')}
            </p>
          );
        }
        if (block.type === 'bullet') {
          return (
            <ul key={i} className="agreement-bullet-list">
              {block.lines.map((text, j) => (
                <li key={j}>{text}</li>
              ))}
            </ul>
          );
        }
        return (
          <ul key={i} className="agreement-lettered-list">
            {block.lines.map((text, j) => (
              <li key={j}>{text}</li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

export default function AgreementView({ onBack, onAccept, formData }: Props) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasScrolledToBottom(true);
      }
    };

    if (el.scrollHeight <= el.clientHeight + 20) {
      setHasScrolledToBottom(true);
    }

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div>
      <h2 className="form-card-title">Review Agreement</h2>
      <p className="form-card-subtitle">
        Please read the full agreement carefully before proceeding.
        {!hasScrolledToBottom && ' Scroll to the bottom to continue.'}
      </p>

      <div className="agreement-wrapper" ref={scrollRef}>
        <div className="agreement-meta">
          {agreementConfig.subtitle && (
            <>
              <strong>{agreementConfig.subtitle}</strong>
              <br />
            </>
          )}
          <strong>{agreementConfig.title}</strong>
          {agreementConfig.lastUpdated && (
            <>
              <br />
              Last updated: {agreementConfig.lastUpdated}
            </>
          )}
        </div>

        {(agreementConfig.pages as Array<{ number: number; content: string }>).map((page, index) => (
          <div key={index} className="agreement-section">
            {/* Page 1 Header Table */}
            {page.number === 1 && (
              <div className="agreement-page-1-header">
                <div className="agreement-page-header">
                  <Image src={logo} alt="Logo" className="header-logo" width={60} height={60} />
                  <span className="header-name">Accelerated Pathways Career College</span>
                </div>
                <h2 className="agreement-title">Accelerated Pathways Career College (APCC)</h2>
                <h3 className="agreement-subtitle">Enrollment Agreement</h3>
                
                <div className="agreement-table">
                  <div className="table-header">Student Information</div>
                  <div className="table-row split">
                    <div className="cell"><span className="label">Student Name:</span> {formData.fullName}</div>
                    <div className="cell"><span className="label">DOB:</span> {formData.dateOfBirth}</div>
                  </div>
                  <div className="table-row">
                    <div className="cell large">
                      <span className="label">Address:</span> <span className="small-instr">(street address, additional address details, city, state, ZIP code)</span>
                      <div className="value">{formData.address}</div>
                    </div>
                  </div>
                  <div className="table-row split">
                    <div className="cell"><span className="label">Phone:</span> {formData.phone}</div>
                    <div className="cell"><span className="label">E-mail:</span> {formData.email}</div>
                  </div>

                  <div className="table-header">Student's Parents / Legal Guardian(s)</div>
                  <div className="table-subheader">(required if the Student is a minor)</div>
                  <div className="table-row"><div className="cell"><span className="label">1st Name:</span> {formData.parent1Name}</div></div>
                  <div className="table-row"><div className="cell"><span className="label">Address:</span> {formData.parent1Address}</div></div>
                  <div className="table-row split">
                    <div className="cell"><span className="label">Phone:</span> {formData.parent1Phone}</div>
                    <div className="cell"><span className="label">E-mail:</span> {formData.parent1Email}</div>
                  </div>
                  <div className="table-row"><div className="cell"><span className="label">2nd Name:</span> {formData.parent2Name}</div></div>
                  <div className="table-row"><div className="cell"><span className="label">Address:</span> {formData.parent2Address}</div></div>
                  <div className="table-row split">
                    <div className="cell"><span className="label">Phone:</span> {formData.parent2Phone}</div>
                    <div className="cell"><span className="label">E-mail:</span> {formData.parent2Email}</div>
                  </div>

                  <div className="table-header">Information in Case of Emergency</div>
                  <div className="table-row"><div className="cell"><span className="label">Emergency Contact Name:</span> {formData.emergencyName}</div></div>
                  <div className="table-row split">
                    <div className="cell"><span className="label">Relationship:</span> {formData.emergencyRelationship}</div>
                    <div className="cell"><span className="label">Phone:</span> {formData.emergencyPhone}</div>
                  </div>
                  <div className="table-row med">
                    <div className="cell-label">
                      <span className="label">Do you have any medical conditions...</span>
                    </div>
                    <div className="cell-value">
                      <span className="small-instr">(Allergies, medications, specific medical accommodations, etc.)</span>
                      <div className="value">{formData.medicalConditions || "None."}</div>
                    </div>
                  </div>
                  <div className="table-row split-hs">
                    <div className="cell"><span className="label">Do you have a High School Diploma or equivalent (GED)?</span></div>
                    <div className="cell center">{formData.highSchoolDiploma}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Logo Header for Page 2+ */}
            {page.number > 1 && (
              <div className="agreement-page-header">
                <Image src={logo} alt="Logo" className="header-logo" width={60} height={60} />
                <span className="header-name">Accelerated Pathways Career College</span>
              </div>
            )}

            {/* Render content only if not Page 1 (which uses custom table) */}
            {page.number !== 1 && (
              <AgreementSectionContent content={page.content} formData={formData} />
            )}
            
            {/* Footer Preview */}
            <div className="agreement-footer-preview">
              <div className="footer-left">
                ______ Student Initials
              </div>
              <div className="footer-center">
                Page {page.number} of {agreementConfig.pages.length}
              </div>
              <div className="footer-right">
                January 15, 2026
              </div>
            </div>
          </div>
        ))}
      </div>

      <label className="agreement-checkbox">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
          disabled={!hasScrolledToBottom}
        />
        <span>
          I have read and understood the full agreement and agree to be bound by
          its terms and conditions.
        </span>
      </label>

      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!isChecked}
          onClick={onAccept}
        >
          I Agree — Continue →
        </button>
      </div>
    </div>
  );
}
