const baseUrl = process.env.DEPLOYMENT_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const paths = ["/", "/recipes", "/planner", "/pantry"];

async function check(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(new URL(path, baseUrl), { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${path} returned ${response.status}`);
    }
    console.log(`ok ${path}`);
  } finally {
    clearTimeout(timeout);
  }
}

for (const path of paths) {
  await check(path);
}

console.log(`Health checks passed for ${baseUrl}`);
