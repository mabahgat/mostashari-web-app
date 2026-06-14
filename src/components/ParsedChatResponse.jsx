import { useState } from 'react';

const IS_DEV = import.meta.env.DEV;

const KNOWN_TAGS = ['system_trace', 'lawyer_notes', 'legal_document'];
const KNOWN_TAG_PATTERN = KNOWN_TAGS.join('|');
const tagRegex = new RegExp(`<(${KNOWN_TAG_PATTERN})(>|\\s[^>]*>)([\\s\\S]*?)<\\/\\1>`, 'g');
const partialKnownTagRegex = new RegExp(`<(?:\\/?(?:${KNOWN_TAG_PATTERN}))(?:>|\\s[^>]*>)`, 'g');

const warnUnexpectedResponse = (message, responseText) => {
  console.warn(`ParsedChatResponse: ${message}`, responseText);
};

/**
 * Parses a response string containing XML-like tags into an array of segments.
 * @param {string} text
 * @returns {{ shouldRenderRawText: boolean, rawText: string, segments: { type: string, content: string }[] }}
 */
const parseResponse = (text) => {
  if (typeof text !== 'string') {
    warnUnexpectedResponse('response was not a string, rendering as-is.', text);
    return {
      shouldRenderRawText: true,
      rawText: text == null ? '' : String(text),
      segments: [],
    };
  }

  if (!text) {
    return {
      shouldRenderRawText: false,
      rawText: text,
      segments: [],
    };
  }

  const segments = [];
  const matchedKnownTags = [];

  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    matchedKnownTags.push(match[0]);

    if (match.index > lastIndex) {
      const plainText = text.slice(lastIndex, match.index).trim();
      if (plainText) {
        segments.push({ type: 'text', content: plainText });
      }
    }

    const content = match[3].trim();
    if (!content) {
      warnUnexpectedResponse(`missing content for <${match[1]}> section, ignoring it.`, text);
    } else {
      segments.push({ type: match[1], content });
    }

    lastIndex = tagRegex.lastIndex;
  }

  const knownTagFragments = text.match(partialKnownTagRegex) || [];
  if (knownTagFragments.length > matchedKnownTags.length * 2) {
    warnUnexpectedResponse('response did not match the expected tagged structure, rendering raw text.', text);
    return {
      shouldRenderRawText: true,
      rawText: text,
      segments: [],
    };
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining) {
      segments.push({ type: 'text', content: remaining });
    }
  }

  return {
    shouldRenderRawText: false,
    rawText: text,
    segments,
  };
};

const SystemTraceSection = ({ content }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ color: '#aaa', fontSize: '12px', marginTop: '8px', marginBottom: '4px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#aaa',
          fontSize: '12px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        aria-expanded={expanded}
      >
        <span>{expanded ? '▼' : '▶'}</span>
        <span>System Trace</span>
      </button>
      {expanded && (
        <div
          style={{
            marginTop: '4px',
            padding: '8px',
            background: '#f5f5f5',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: '#aaa',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export const ParsedChatResponse = ({ text }) => {
  const { shouldRenderRawText, rawText, segments } = parseResponse(text);

  if (shouldRenderRawText || segments.length === 0) {
    return <span>{rawText}</span>;
  }

  return (
    <div>
      {segments.map((seg, idx) => {
        if (seg.type === 'system_trace') {
          if (!IS_DEV) return null;
          return <SystemTraceSection key={idx} content={seg.content} />;
        }
        if (seg.type === 'lawyer_notes') {
          return (
            <p key={idx} style={{ fontWeight: 'bold', margin: '4px 0', whiteSpace: 'pre-wrap' }}>
              {seg.content}
            </p>
          );
        }
        if (seg.type === 'legal_document') {
          return (
            <p key={idx} style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
              {seg.content}
            </p>
          );
        }
        // plain text
        return (
          <p key={idx} style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
            {seg.content}
          </p>
        );
      })}
    </div>
  );
};
