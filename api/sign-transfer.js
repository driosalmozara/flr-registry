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
  const transferId = req.body && req.body.transfer_id;
  if (!transferId) return res.status(400).json({ error: 'falta transfer_id' });
  const list = await fetch(`${supabaseUrl}/rest/v1/transfers?id=eq.${transferId}&status=eq.pendiente`, { headers: h }).then(r => r.json());
  if (!Array.isArray(list) || list.length === 0) return res.status(404).json({ error: 'cesión no encontrada o ya firmada' });
  const t = list[0];
  if (t.to_dominant_id !== me.id) return res.status(403).json({ error: 'no te corresponde firmar esta cesión' });
  const rel = await fetch(`${supabaseUrl}/rest/v1/relationships?submissive_id=eq.${t.submissive_id}&status=eq.confirmed`, { method: 'PATCH', headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ dominant_id: t.to_dominant_id }) });
  if (!rel.ok) return res.status(500).json({ error: 'no se pudo actualizar la relación' });
  await fetch(`${supabaseUrl}/rest/v1/transfers?id=eq.${t.id}`, { method: 'PATCH', headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'activa', signed_at: new Date().toISOString() }) });
  res.status(200).json({ ok: true });
}
