/* eslint-disable max-lines-per-function */
const buildSegmentationPrompt =
  () => `You will be given arbitrary text that may describe zero or more calendar events.

Return valid JSON ONLY in this format (no extra keys):
{
  "starts": [1, 15, 42]
}

Segmentation rules:
1. Every line in the input must be assigned to exactly one event chunk. No text should be left out or unassigned.
2. Blank lines (lines containing only whitespace) are NOT events, but may separate events.
3. The only valid way to split events is at a line break. If an event spans multiple lines, all those lines must be included in its chunk.
4. A line qualifies as the *start* of a new event only if it introduces a **new date, time, or clearly different occasion**.  Lines that merely supply details (e.g. prefixed with "When:", "Where:", "Location:", "Time:") STILL belong to the current event – do NOT treat them as separate events.
5. Bullet or numbered schedules: each bullet/number *is* a new event **iff** it contains its own date **or** time token (digits + am/pm or yyyy-mm-dd etc.). Headers that contain words like "schedule", "agenda", "itinerary", "timeline", "offsite" **and** have NO digits/time are NEVER events.
6. Lines that start with "When:", "Where:", "Location:", "Time:", "Date:", "Details:" are DETAIL lines – they **MUST NOT** appear in the "starts" array. If they do, replace them with the closest previous non-detail line that introduces that event.
7. If the very first line contains keywords (schedule|agenda|timeline|offsite|workshop[s]?) AND is immediately followed by a numbered or bulleted list, treat the header as *context* only—do NOT include it in "starts". Instead include every numbered/bulleted line that contains a time or date.
8. Always choose the *earliest* eligible line for an event. If both a narrative headline and a later detail line describe the same event, pick the headline.
9. Numbered/bulleted agendas: if bullet numbers form a consecutive sequence (1.,2.,3. or •,– etc.) you **must** output a start index for every such bullet.
10. A capitalised line that contains event keywords (party|birthday|graduation|conference|meeting|board|wedding|concert|picnic) counts as a new event even if it lacks an explicit time.
11. You must ALWAYS return at least one start index whenever the text references a date, time, or event keyword. [] allowed only for non-event text.
12. Each start index must be the 1-based line number of the FIRST line of a new event.
13. Indices strictly ascending, max 10.
14. If no events exist, return { "starts": [] }.

Additional examples:
Example 2 – header with bullet times (total lines = 5):
1: Saturday schedule:
2: • Soccer practice 8am
3: • Grocery run 10am
4: • Movie night 8pm
5:
→ "starts": [2, 3, 4]

Example 3 – event with detail lines (total lines = 3):
1: Alex's birthday dinner!
2: When: Sat July 20, 7pm
3: Where: 42 Main St
→ "starts": [1]

Example 4 – agenda header (total lines = 7):
1: Agenda 14 Feb:
2: – Breakfast 9
3: – Stand-up 10
4: – Feature review 11
5: – Release party 20:00
6: – Team photo 22:00
7:
→ "starts": [2,3,4,5,6]

Example 5 – timeline with dashes (total lines = 6):
1: Concert day timeline:
2: – Soundcheck 15:00
3: – Meet & greet 17:00
4: – Headline show 20:00
5: – After-party 23:00
6:
→ "starts": [2,3,4,5]

Example 6 – single-line reminder:
1: Quick note: Parent-teacher conference next Thursday 2pm.
→ "starts": [1]

Example 7 – narrative header + details:
1: Team meeting tomorrow at 4pm at Nori House
2:
3:
4: Hey everyone!
5:
6: FOOD BOARD PARTY – Part 2!
7: When: Saturday, July 19, 2025, at 5:00 PM
→ "starts": [1,6]

Example 8 – detail lines excluded:
1: FOOD BOARD PARTY – Part 2!
2: When: Saturday, July 19, 2025, at 5:00 PM
→ "starts": [1]

Example 9 – workshops header ignored:
1: Workshops 30 Mar:
2: 1. Git at 9
3: 2. Docker at 11
4: 3. Kubernetes at 13
5: 4. Cloud at 15
6: 5. Testing at 17
7: 6. Q&A at 19
→ "starts": [2,3,4,5,6,7]

Example 10 – two events with detail lines:
1: Team meeting tomorrow at 4pm at Nori House
2:
3: FOOD BOARD PARTY – Part 2!
4: When: Saturday, July 19, 2025, at 5:00 PM
→ "starts": [1,3]

Return nothing else – no comments or trailing text.`;

module.exports = async ({ vars }) => {
  const rawLines = vars.input.split(/\r?\n/);
  const enumerated = rawLines.map((l, i) => `${i + 1}: ${l}`).join('\n');

  return `${buildSegmentationPrompt()}\n\n${enumerated}`;
};
