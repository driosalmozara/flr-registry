export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método no permitido' });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'sin autorización' });
  const token = authHeader.replace('Bearer ', '');
  const me = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: `Bearer ${token}` } }).then(r => r.json());
  if (!me || !me.id) return res.status(401).json({ error: 'token inválido' });
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const { submissive_id, to_dominant_id, duration, expires_at, note } = req.body || {};
  if (!submissive_id || !to_dominant_id) return res.status(400).json({ error: 'faltan datos' });
  if (duration !== 'indefinida' && duration !== 'temporal') return res.status(400).json({ error: 'duración inválida' });
  if (duration === 'temporal' && !expires_at) return res.status(400).json({ error: 'falta la fecha máxima' });
  const rel = await fetch(`${supabaseUrl}/rest/v1/relationships?dominant_id=eq.${me.id}&submissive_id=eq.${submissive_id}&status=eq.confirmed`, { headers: h }).then(r => r.json());
  if (!Array.isArray(rel) || rel.length === 0) return res.status(403).json({ error: 'no eres la Dominante de este sumiso' });
  if (to_dominant_id === me.id) return res.status(400).json({ error: 'no puedes cederte a ti misma' });
  const target = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${to_dominant_id}&role=eq.dominant`, { headers: h }).then(r => r.json());
  if (!Array.isArray(target) || target.length === 0) return res.status(400).json({ error: 'la destinataria debe ser una Dominante' });
  const body = {
    submissive_id, from_dominant_id: me.id, to_dominant_id, duration,
    expires_at: duration === 'temporal' ? new Date(expires_at + 'T23:59:59').toISOString() : null,
    note: (note || '').trim() || null, status: 'pendiente'
  };
  const ins = await fetch(`${supabaseUrl}/rest/v1/transfers`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) });
  if (!ins.ok) return res.status(500).json({ error: 'no se pudo crear la cesión' });
  res.status(200).json({ ok: true });
}
