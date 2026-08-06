export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método no permitido' });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'sin autorización' });
  
  const token = authHeader.replace('Bearer ', '');
  const me = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  }).then(r => r.json());
  
  if (!me || !me.id) return res.status(401).json({ error: 'token inválido' });

  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const relId = req.body && req.body.relationship_id;
  if (!relId) return res.status(400).json({ error: 'falta relationship_id' });

  // 1. Verificar que la Dominante es la dueña de esta relación
  const rel = await fetch(`${supabaseUrl}/rest/v1/relationships?id=eq.${relId}&dominant_id=eq.${me.id}&status=eq.confirmed`, { headers: h }).then(r => r.json());
  if (!Array.isArray(rel) || rel.length === 0) return res.status(403).json({ error: 'no eres la Dominante de este sumiso' });

  // 2. Revocar contratos asociados
  await fetch(`${supabaseUrl}/rest/v1/contracts?relationship_id=eq.${relId}`, {
    method: 'PATCH', headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'revoked' })
  });

  // 3. Eliminar Carnet y Registro (para invalidar el QR y la verificación pública)
  const records = await fetch(`${supabaseUrl}/rest/v1/submissive_records?relationship_id=eq.${relId}`, { headers: h }).then(r => r.json());
  if (Array.isArray(records) && records.length > 0) {
     const recIds = records.map(r => r.id).join(',');
     await fetch(`${supabaseUrl}/rest/v1/cards?record_id=in.(${recIds})`, { method: 'DELETE', headers: h });
     await fetch(`${supabaseUrl}/rest/v1/submissive_records?id=in.(${recIds})`, { method: 'DELETE', headers: h });
  }

  // 4. Romper el vínculo (eliminar la relación)
  await fetch(`${supabaseUrl}/rest/v1/relationships?id=eq.${relId}`, { method: 'DELETE', headers: h });

  res.status(200).json({ ok: true });
}
