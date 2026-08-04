export default async function handler(req, res) {
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

  const admins = await fetch(`${supabaseUrl}/rest/v1/app_admins?user_id=eq.${me.id}`, { headers: h }).then(r => r.json());
  if (!Array.isArray(admins) || admins.length === 0) return res.status(403).json({ error: 'no eres Administrador' });

  const targetId = req.body && req.body.user_id;
  if (!targetId) return res.status(400).json({ error: 'falta user_id' });
  if (targetId === me.id) return res.status(400).json({ error: 'no puedes eliminarte a ti mismo' });

  const tAdmin = await fetch(`${supabaseUrl}/rest/v1/app_admins?user_id=eq.${targetId}`, { headers: h }).then(r => r.json());
  if (Array.isArray(tAdmin) && tAdmin.length > 0) return res.status(400).json({ error: 'no puedes eliminar a un Administrador' });

  const del = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetId}`, { method: 'DELETE', headers: h });

  res.status(200).json({ ok: del.status === 200 || del.status === 204, status: del.status });
}
