// /api/chat.js — Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages (array) required' });
    }

    const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Límite de historial para cuidar costos
    const MAX_MESSAGES = 21; // 1 system + 10 pares
    let msgs = messages;
    if (msgs.length > MAX_MESSAGES) {
      const sys = msgs[0];
      const tail = msgs.slice(- (MAX_MESSAGES - 1));
      msgs = [sys, ...tail];
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 220, // respuestas concisas
        messages: msgs
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: `OpenAI error: ${text}` });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content ?? '';
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ reply, model: MODEL });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
