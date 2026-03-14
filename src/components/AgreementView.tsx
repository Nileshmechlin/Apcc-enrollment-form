'use client';

import { useState, useRef, useEffect } from 'react';
import { agreementConfig } from '@/config/agreement';

interface Props {
  onBack: () => void;
  onAccept: () => void;
}

/** Renders agreement section content: paragraphs, ➔ bullets, and a) b) c) d) lettered lines. */
function AgreementSectionContent({ content }: { content: string }) {
  const lines = content.split('\n');
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

export default function AgreementView({ onBack, onAccept }: Props) {
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

        {(agreementConfig.sections as Array<{ heading: string; content: string; csrTableOnPdf?: boolean }>).map((section, index) => (
          <div key={index} className="agreement-section">
            <h3>{section.heading}</h3>
            <AgreementSectionContent content={section.content} />
            {/* Section 7 table (Start Date, Starting Program, Tuition, Notes) is CSR-only — not shown to student */}
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
