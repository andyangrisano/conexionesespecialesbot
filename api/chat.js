
// Vercel Serverless Function: /api/chat
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages (array) required' });
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 400,
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
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
