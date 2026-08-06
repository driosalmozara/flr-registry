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
  const now = new Date().toISOString();
  const list = await fetch(`${supabaseUrl}/rest/v1/transfers?status=eq.activa&duration=eq.temporal&expires_at=lte.${now}`, { headers: h }).then(r => r.json());
  let n = 0;
  for (const t of (list || [])) {
    await fetch(`${supabaseUrl}/rest/v1/relationships?submissive_id=eq.${t.submissive_id}&dominant_id=eq.${t.to_dominant_id}&status=eq.confirmed`, { method: 'PATCH', headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ dominant_id: t.from_dominant_id }) });
    await fetch(`${supabaseUrl}/rest/v1/transfers?id=eq.${t.id}`, { method: 'PATCH', headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'expirada' }) });
    n++;
  }
  res.status(200).json({ ok: true, retornados: n });
}
