import webpush from 'web-push';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método no permitido' });

  const { user_id, title, body, link } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'falta user_id' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const cfg = await fetch(`${url}/rest/v1/push_config?select=*`, { headers: h }).then(r => r.json());
  if (!Array.isArray(cfg) || cfg.length === 0) return res.status(500).json({ error: 'sin claves VAPID' });

  webpush.setVapidDetails('mailto:trono@supremacia-femenina.app', cfg[0].public_key, cfg[0].private_key);

  const subs = await fetch(`${url}/rest/v1/push_subscriptions?user_id=eq.${user_id}`, { headers: h }).then(r => r.json());

  let sent = 0;
  for (const s of (subs || [])) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body, link })
      );
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await fetch(`${url}/rest/v1/push_subscriptions?id=eq.${s.id}`, { method: 'DELETE', headers: h });
      }
    }
  }

  res.status(200).json({ ok: true, sent });
}
