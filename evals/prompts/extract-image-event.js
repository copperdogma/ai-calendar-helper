// Generates the chat message payload for image-event extraction.
// Called by promptfoo with ({ vars }) where vars.image and vars.text are provided.

module.exports = ({ vars }) => [
  {
    role: 'system',
    content: `You are an assistant that extracts a single calendar event from a flyer image (provided as file_id) and optional OCR text.

Return a *valid JSON object only* with exactly these keys: title, startDate, endDate, location, description, timezone, confidence.

Requirements for the description field:
• It must be at least one full sentence (≥ 10 characters).
• If the flyer contains a narrative sentence, copy it verbatim.
• Otherwise craft a short invitation sentence.
• Never leave description blank.

Example output:
{"title":"Birthday Party","startDate":"2025-07-15T14:00:00","endDate":"2025-07-15T16:00:00","location":"123 Maple St","description":"Join us to celebrate Amanda's birthday!","timezone":"UTC","confidence":0.92}`,
  },
  {
    role: 'user',
    content: [
      {
        type: 'input_image',
        file_id: vars.fileId,
        detail: 'high',
      },
      {
        type: 'input_text',
        text: `Extract the event details from this flyer and return JSON only. ${vars.text || ''}`,
      },
    ],
  },
];
