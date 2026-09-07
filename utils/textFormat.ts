// textFormat.ts — v2.0: markdown cleanup + rich-content segmentation.
//
// IMPORTANT ARCHITECTURE CHANGE: providers no longer clean text before
// returning it (see providers/*.ts — they now just .trim()). Cleaning
// and code-block extraction both happen HERE, at render time, so fenced
// code blocks survive intact until parseMessageSegments splits them out
// (previously cleanAIText stripped triple-backticks before the UI ever
// saw them, making rich code rendering impossible).

export interface TextSegment {
  type: 'text';
  content: string;
}

export interface CodeSegment {
  type: 'code';
  content: string;
  language?: string;
}

export type MessageSegment = TextSegment | CodeSegment;

const FENCE_REGEX = /```(\w+)?\n?([\s\S]*?)```/g;

/**
 * Cleans a plain-text chunk (never a code block — those are extracted
 * separately by parseMessageSegments before this ever sees them).
 * Strips bold/italic/heading markers and inline-code backticks,
 * converts dash/asterisk bullets to a plain bullet character, leaves
 * numbered lists completely untouched, and collapses only genuinely
 * excessive blank-line runs.
 */
export function cleanAIText(raw: string): string {
  let text = raw;

  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');

  // Inline code spans (single backticks) — the block-level ``` ``` case
  // is handled upstream by parseMessageSegments, not here.
  text = text.replace(/`([^`]*)`/g, '$1');

  // Markdown headings ("# ", "## ", ...) at the start of a line
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Dash/asterisk bullets become a plain bullet character. Numbered
  // lists ("1. ", "2) ") are left untouched — no regex here matches
  // a line starting with a digit.
  text = text.replace(/^[ \t]*[-*]\s+/gm, '• ');

  // Collapse 3+ consecutive newlines to one blank line, preserving
  // intentional paragraph breaks.
  text = text.replace(/\n{3,}/g, '\n\n');

  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();

  return text;
}

// Backward-compatible alias.
export const cleanGeminiText = cleanAIText;

/**
 * Splits raw model output into an ordered list of text/code segments.
 * Fenced code blocks (```lang\ncode```) are preserved exactly as
 * written (indentation intact, no cleanup applied). Everything between
 * fences is cleaned via cleanAIText. If no fences are found, returns a
 * single cleaned text segment.
 */
export function parseMessageSegments(raw: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  FENCE_REGEX.lastIndex = 0;
  while ((match = FENCE_REGEX.exec(raw)) !== null) {
    const [full, lang, code] = match;

    if (match.index > lastIndex) {
      const textChunk = raw.slice(lastIndex, match.index);
      if (textChunk.trim().length > 0) {
        segments.push({ type: 'text', content: cleanAIText(textChunk) });
      }
    }

    segments.push({
      type: 'code',
      content: code.replace(/\n+$/g, ''),
      language: lang || undefined,
    });

    lastIndex = match.index + full.length;
  }

  if (lastIndex < raw.length) {
    const remainder = raw.slice(lastIndex);
    if (remainder.trim().length > 0) {
      segments.push({ type: 'text', content: cleanAIText(remainder) });
    }
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', content: cleanAIText(raw) });
  }

  return segments;
}

/**
 * Precomputes the progressive reveal states for word-by-word streaming
 * (Part A). steps[i] is the visible substring after i words have been
 * revealed; steps[0] is empty; steps.length - 1 is the total word
 * count. Whitespace immediately following a revealed word is attached
 * to that same step so spacing reveals naturally.
 */
export function buildWordRevealSteps(fullText: string): string[] {
  const tokens = fullText.match(/\S+|\s+/g) ?? [];
  const steps: string[] = [''];
  let acc = '';

  for (const token of tokens) {
    acc += token;
    if (/\S/.test(token)) {
      steps.push(acc);
    } else {
      steps[steps.length - 1] = acc;
    }
  }

  return steps;
}