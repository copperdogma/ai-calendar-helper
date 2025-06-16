export const SEGMENTATION_PROMPT = `You will be given arbitrary text that may describe zero or more calendar events.

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
    This includes the **final** bullet in the sequence – do not omit the last item. Bullets with summary words like "Closing", "Wrap-up", or "After-party" **still count as events** if they contain a time or date token (e.g. "4:00").
10. A capitalised line that contains event keywords (party|birthday|graduation|conference|meeting|board|wedding|concert|picnic) counts as a new event even if it lacks an explicit time.
11. Narrative sentences that mention **birthday**, **party**, **celebration**, **graduation**, or similar event keywords **and** include a relative or explicit date/time phrase (e.g. "next Wednesday", "tomorrow", "July 19") also qualify as the start of a new event, even if the sentence is not fully capitalised.
    A narrative sentence **without any date, time, or relative time phrase is NOT a valid start line**.
    Valid relative phrases are limited to: **today, tonight, tomorrow, this (morning|afternoon|evening), next <day>, next <month>**, or an explicit month/day/year or time containing digits.
    If the line contains NO digits **and** none of the above relative keywords, do NOT include it.
12. When both a narrative sentence (see Rule 11) and a stylised header (e.g. all-caps "FOOD BOARD PARTY") refer to the same occasion, choose the **earlier** narrative sentence per Rule 8.
    (Rule 12 takes precedence over Rule 10.)
    After selecting the narrative sentence, **do NOT** include the later stylised header or any of its detail lines in "starts" – each event must appear only once.
    More generally: **never** output two start indices that describe the **same date/occasion**.
    Practical tip: if a fully-capitalised header line appears **within 5 lines** after a chosen narrative start **and** shares an obvious keyword (party|birthday|meeting|board) with that narrative, assume it's the same event and SKIP it.
    If a fully- or majority-uppercase line appears **within the next 3 non-empty lines** after a chosen start, assume it is a subtitle and **skip it**.
13. You must ALWAYS return at least one start index whenever the text references a date, time, or event keyword. [] allowed only for non-event text.
14. Each start index must be the 1-based line number of the FIRST line of a new event.
15. Indices strictly ascending, max 10.
16. If no events exist, return { "starts": [] }.

Return nothing else – no comments or trailing text.`;
