import { NextResponse } from "next/server";

const MAX_FALLBACK_CHARS = 400;

function splitForFallback(text: string): string[] {
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
