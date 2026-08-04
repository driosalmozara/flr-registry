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

  const tAdmin = await fetch(`${supabaseUrl}/rest/v1/app_admins?user_id=eq.${targetId}`, { headers: h }).then(r => r.json());
  if (Array.isArray(tAdmin) && tAdmin.length > 0) return res.status(403).json({ error: 'no puedes suplantar a otro Administrador' });

  const target = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetId}`, { headers: h }).then(r => r.json());
  if (!target || !target.email) return res.status(404).json({ error: 'miembro no encontrado' });

  const origin = req.headers.origin || supabaseUrl;

  const gen = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: target.email, redirectTo: `${origin}/index.html` }),
  });

  const genJson = await gen.json();
  if (!genJson || !genJson.action_link) return res.status(500).json({ error: 'no se pudo generar el enlace' });

  res.status(200).json({ link: genJson.action_link });
}
