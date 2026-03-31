// This helper keeps machine translation in one place so pages do not all duplicate
// the same fetch/error-handling code. For now it uses MyMemory; later we can swap the
// internals to DeepL without changing every page component again.
export async function translateEnglishToGerman(text: string): Promise<string> {
  const trimmedText = text.trim();

  // Empty input should stay empty instead of triggering a network request.
  if (!trimmedText) {
    return "";
  }

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmedText)}&langpair=en|de`
    );
    const data = (await response.json()) as {
      responseData?: {
        translatedText?: string;
      };
    };

    // Fall back to the original text if the API returns an unexpected shape.
    return data.responseData?.translatedText?.trim() || trimmedText;
  } catch {
    // Translation should never block saving a recipe or profile.
    return trimmedText;
  }
}
