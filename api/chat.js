// Vercel Serverless Function: /api/chat
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages (array) required' });
    }

    // ✅ Force mini
    const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // (optional) trim history to last 10 turns to save tokens
    const MAX_MESSAGES = 21; // 1 system + 10 pairs
    if (messages.length > MAX_MESSAGES) {
      const sys = messages[0];
      messages.splice(0, messages.length, sys, ...messages.slice(- (MAX_MESSAGES - 1)));
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,               // ✅ always mini
        temperature: 0.6,           // cheaper/more consistent
        max_tokens: 200,            // cap reply size
        messages
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: `OpenAI error: ${text}` });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content ?? '';
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ reply, model: MODEL }); // (debug) returns model used
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
