import { Agent } from '../../dist/agent.js';

let agentInstance = null;

async function getAgent() {
  if (!agentInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL;
    const model = process.env.OPENAI_MODEL || 'gpt-4o';

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    agentInstance = new Agent(apiKey, baseURL, model, {});
  }

  return agentInstance;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = await req.json();
    const prompt = payload.prompt;
    const image = payload.image;
    const imageFileName = payload.imageFileName;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'prompt field is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let finalPrompt = prompt;
    if (image && imageFileName) {
      finalPrompt = `${prompt}\n\n[Image Attached: ${imageFileName}]\nImage Data (base64): ${image}`;
    }

    const agent = await getAgent();
    const result = await agent.chatToString(finalPrompt);

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
