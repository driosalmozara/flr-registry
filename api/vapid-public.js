import webpush from 'web-push';

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  let cfg = await fetch(`${url}/rest/v1/push_config?select=*`, { headers: h }).then(r => r.json());

  if (!Array.isArray(cfg) || cfg.length === 0) {
    const keys = webpush.generateVAPIDKeys();
    await fetch(`${url}/rest/v1/push_config`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ id: 1, public_key: keys.publicKey, private_key: keys.privateKey })
    });
    cfg = [{ public_key: keys.publicKey }];
  }

  res.status(200).json({ publicKey: cfg[0].public_key });
}
