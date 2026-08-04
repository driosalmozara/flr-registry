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

  const del = await fetch(`${supabaseUrl}/auth/v1/admin/users/${me.id}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });

  res.status(200).json({ ok: del.status === 200 || del.status === 204, status: del.status });
}
