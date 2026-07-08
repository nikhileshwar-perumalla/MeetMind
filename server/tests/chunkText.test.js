import { chunkText } from '../src/services/ai/embeddings.js';

describe('chunkText', () => {
  test('returns empty array for empty input', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   ')).toEqual([]);
  });

  test('returns a single chunk for short text', () => {
    const chunks = chunkText('Hello world. This is a short transcript.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain('Hello world');
  });

  test('splits long text into overlapping chunks', () => {
    const sentence = 'We discussed the quarterly roadmap in detail. ';
    const text = sentence.repeat(200); // ~9,400 chars
    const chunks = chunkText(text, { chunkSize: 1000, overlap: 150 });

    expect(chunks.length).toBeGreaterThan(5);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(1000);
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  test('every chunk is non-empty and whitespace-normalized', () => {
    const text = 'line one\n\n   line two\t\tline three. '.repeat(100);
    const chunks = chunkText(text, { chunkSize: 500, overlap: 50 });
    for (const chunk of chunks) {
      expect(chunk).not.toMatch(/\s{2,}/);
    }
  });

  test('no content is lost between chunks (coverage)', () => {
    const words = Array.from({ length: 600 }, (_, i) => `word${i}.`);
    const text = words.join(' ');
    const chunks = chunkText(text, { chunkSize: 800, overlap: 100 });
    const joined = chunks.join(' ');
    // Spot-check first, middle, and last words survive chunking.
    expect(joined).toContain('word0.');
    expect(joined).toContain('word300.');
    expect(joined).toContain('word599.');
  });
});
