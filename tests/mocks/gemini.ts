// 1x1 transparent PNG as base64 (minimal valid PNG)
export const MOCK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export function mockGeminiImageResponse() {
  return {
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                data: MOCK_PNG_BASE64,
                mimeType: 'image/png',
              },
            },
          ],
        },
      },
    ],
  }
}

export function mockGeminiEmptyResponse() {
  return {
    candidates: [
      {
        content: {
          parts: [],
        },
      },
    ],
  }
}
