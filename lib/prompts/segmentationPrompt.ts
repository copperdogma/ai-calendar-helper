export const SEGMENTATION_PROMPT = `You will receive some text that may describe zero or more calendar events.

Read through the input and decide how many distinct calendar events exist. It may be just one, but it may be many.

Think step-by-step **silently and internally** (do NOT reveal your reasoning):
1. Identify every event and note a one-sentence description that includes its date/time.
2. For each event, decide which input line is the very FIRST line that introduces it.
   • If a header line is immediately followed by a bullet (•, –, -) or numbered list item (e.g., "1.") that contains a date/time, treat that header as context only – choose the list items instead.
   • In such bullet/numbered lists, include EVERY list item that contains a date or time; skip list items without a date/time.

Targeted clarifications:
    • Lines that begin with "When:", "Where:", "Time:", "Date:", or "Location:" are detail lines – **never** output them. Instead, keep the earliest non-detail line that introduced this event.
    • Any line that ends with a colon (:) **and** is immediately followed (within ONE non-blank line) by a numbered or bullet list containing date/time information is a context/header line – **do not** output it.
    • After such a context/header, output the start index for **every** subsequent bullet/number item that contains a date/time until the list ends.

3. When you are confident, output ONLY valid JSON in this exact shape (no extra keys):
{
  "starts": [1, 15, 42]
}

Requirements for the JSON:
• The "starts" array must list the 1-based line number for the first line of each event, in ascending order.
• If no events are present, output { "starts": [] }.

Return nothing else—no comments, no chain-of-thought, no additional keys, no trailing text.`;
