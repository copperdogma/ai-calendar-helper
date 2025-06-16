import { AIProcessingService, OpenAIClient } from '@/lib/ai';

// Simple deterministic mock that returns canned results depending on the
// requested function name so we can exercise the full three-stage pipeline
// without calling the real OpenAI API.
function createMockClient(): OpenAIClient {
  return {
    chat: {
      completions: {
        create: jest.fn(async (params: any) => {
          const fnName = params.function_call?.name;
          let argumentsObj: Record<string, unknown> = {};

          switch (fnName) {
            case 'identify_events':
              argumentsObj = {
                events: [{ summary: 'Event one on Friday' }, { summary: 'Event two on Saturday' }],
              };
              break;
            case 'start_lines':
              argumentsObj = {
                starts: [1, 3],
              };
              break;
            case 'extract_events': {
              // Use the snippet text (last user message) to synthesize minimal output
              const eventText: string = params.messages[1].content;
              argumentsObj = {
                events: [
                  {
                    title: eventText.split('\n')[0] || 'Test title',
                    description: '',
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    location: 'Somewhere',
                    timezone: 'UTC',
                    summary: 'Summ',
                    confidence: 1,
                    recurrence: null,
                    isAllDay: false,
                  },
                ],
              };
              break;
            }
            default:
              throw new Error(`Unexpected function name: ${fnName}`);
          }

          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: '',
                  function_call: {
                    name: fnName,
                    arguments: JSON.stringify(argumentsObj),
                  },
                },
              },
            ],
          };
        }),
      },
    },
  };
}

describe('AIProcessingService – three-stage pipeline', () => {
  const sampleInput = `Team meeting Friday 10am\nZoom link to follow\n\nSaturday brunch 11:30 at Cafe Neo`;

  it('segments text into chunks and extracts events', async () => {
    const svc = new AIProcessingService(createMockClient());

    const chunks = await svc.segmentText(sampleInput);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].startLine).toBe(1);
    expect(chunks[1].startLine).toBe(3);

    const events = await svc.extractEvents(sampleInput);
    expect(events).toHaveLength(2);
    expect(events[0].title).toContain('Team meeting');
  });

  it('throws when identification stage returns malformed JSON', async () => {
    const badClient = createMockClient();
    // override identify_events to return bad JSON
    jest
      .mocked(badClient.chat.completions.create as any)
      .mockImplementationOnce(async (_params: any) => ({
        choices: [
          {
            message: {
              role: 'assistant',
              content: '',
              function_call: {
                name: 'identify_events',
                arguments: '{ bad json',
              },
            },
          },
        ],
      }));

    const svc = new AIProcessingService(badClient);

    await expect(svc.segmentText(sampleInput)).rejects.toThrow();
  });
});
