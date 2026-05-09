import { NextResponse } from "next/server";

// TRANSLATE API MAP
// Browser pages call /api/translate when they need German text.
// This keeps translation API keys on the server, away from the browser.
// DeepL is used when DEEPL_API_KEY exists; MyMemory is the no-key fallback.

const MAX_FALLBACK_CHARS = 400;

function splitForFallback(text: string): string[] {
  // The fallback translator works better with smaller chunks.
  // Keep line breaks so recipe steps still look like recipe steps after translation.
  const normalizedText = text.replace(/\r\n/g, "\n");
  const lines = normalizedText.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    // Preserve blank lines so multi-line instructions keep their shape after translation.
    if (!line.trim()) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      chunks.push("");
      continue;
    }

    if (!currentChunk) {
      currentChunk = line;
      continue;
    }

    const candidate = `${currentChunk}\n${line}`;
    if (candidate.length <= MAX_FALLBACK_CHARS) {
      currentChunk = candidate;
    } else {
      chunks.push(currentChunk);
      currentChunk = line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function translateWithDeepL(text: string, apiKey: string): Promise<string> {
  // DeepL is the nicer translator. The endpoint changes depending on free/pro keys.
  const endpoint =
    process.env.DEEPL_API_URL ||
    (apiKey.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: "EN",
      target_lang: "DE",
      preserve_formatting: true,
      formality: "prefer_more",
      split_sentences: "1",
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL translation failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    translations?: Array<{
      text?: string;
    }>;
  };

  return data.translations?.[0]?.text?.trim() || text;
}

async function translateWithFallback(text: string): Promise<string> {
  // Fallback path: free public translation service.
  // It is less perfect, but it means saving still works even without a DeepL key.
  const chunks = splitForFallback(text);
  const translatedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      if (!chunk) {
        return "";
      }

      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|de`
      );

      if (!response.ok) {
        return chunk;
      }

      const data = (await response.json()) as {
        responseData?: {
          translatedText?: string;
        };
      };

      return data.responseData?.translatedText?.trim() || chunk;
    })
  );

  return translatedChunks.join("\n");
}

export async function POST(request: Request) {
  // Route Handler entry point. Next.js calls this for POST /api/translate.
  const body = (await request.json()) as {
    text?: unknown;
  };

  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ translation: "" });
  }

  try {
    const apiKey = process.env.DEEPL_API_KEY;
    const translation = apiKey
      ? await translateWithDeepL(text, apiKey)
      : await translateWithFallback(text);

    return NextResponse.json({ translation });
  } catch {
    const translation = await translateWithFallback(text);
    return NextResponse.json({ translation });
  }
}
