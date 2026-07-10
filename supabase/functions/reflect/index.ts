// Supabase Edge Function: `reflect`
// Owns the Claude call AND the safety layer. The Anthropic key never leaves the
// server. The key is read from the ANTHROPIC_API_KEY function secret.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

type WeekSummary = {
  moodCount: number;
  avgMood: number | null;
  habitCheckins: number;
  topStreak: number;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Guardrail: Vitalis gives wellness reflections, not clinical advice. This system
// prompt constrains tone and scope; keep it strict.
const SYSTEM_PROMPT = `You are Vitalis, a warm, concise wellness companion.
You reflect on a user's week of mood + habit data to encourage self-awareness.
Rules you must always follow:
- You are NOT a therapist or doctor. Never diagnose, never suggest medication, never claim to treat any condition.
- Keep it to 2-3 short sentences, supportive and specific to the data given.
- If the data suggests sustained low mood, gently and non-alarmingly suggest talking to someone they trust or a professional, without diagnosing.
- Never use clinical or alarming language.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { summary } = (await req.json()) as { summary: WeekSummary };
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return json({ error: 'Server not configured' }, 500);
    }

    const userContent = `Here is the user's last 7 days:
- Mood logs: ${summary.moodCount}
- Average mood (1-5): ${summary.avgMood ?? 'n/a'}
- Habit check-ins: ${summary.habitCheckins}
Write a brief reflection.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!res.ok) {
      return json({ error: 'Upstream error' }, 502);
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? '';
    return json({ text });
  } catch (_e) {
    return json({ error: 'Bad request' }, 400);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
