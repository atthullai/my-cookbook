// Client components call this helper, which in turn talks to a server Route Handler.
// That lets us keep API keys on the server and avoid long browser URL requests.
export async function translateEnglishToGerman(text: string): Promise<string> {
  const trimmedText = text.trim();

  // Empty input should stay empty instead of triggering a network request.
  if (!trimmedText) {
    return "";
  }

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: trimmedText,
      }),
    });

    if (!response.ok) {
      return trimmedText;
    }

    const data = (await response.json()) as {
      translation?: string;
    };

    // Fall back to the original text if the API returns an unexpected shape.
    return data.translation?.trim() || trimmedText;
  } catch {
    // Translation should never block saving a recipe or profile.
    return trimmedText;
  }
}
