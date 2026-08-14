export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método no permitido' });
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'falta user_id' });

  const url = process.env.SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const H = { apikey: service, Authorization: `Bearer ${service}` };

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'sin token' });
  const who = await fetch(`${url}/auth/v1/user`, { headers: { apikey: service, Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null);
  if (!who || !who.id) return res.status(401).json({ error: 'token inválido' });

  const callerAdmin = await fetch(`${url}/rest/v1/app_admins?user_id=eq.${who.id}`, { headers: H }).then(r => r.json());
  const callerMod = await fetch(`${url}/rest/v1/app_moderators?user_id=eq.${who.id}`, { headers: H }).then(r => r.json());
  const isStaff = (Array.isArray(callerAdmin) && callerAdmin.length) || (Array.isArray(callerMod) && callerMod.length);
  if (!isStaff) return res.status(403).json({ error: 'sin facultades de moderación' });

  const target = await fetch(`${url}/rest/v1/profiles?id=eq.${user_id}&select=id,role`, { headers: H }).then(r => r.json());
  if (!Array.isArray(target) || !target.length || target[0].role !== 'submissive')
    return res.status(403).json({ error: 'objetivo inválido' });
  const rel = await fetch(`${url}/rest/v1/relationships?submissive_id=eq.${user_id}&status=eq.confirmed`, { headers: H }).then(r => r.json());
  if (Array.isArray(rel) && rel.length) return res.status(403).json({ error: 'el sumiso tiene dueña' });

  const del = await fetch(`${url}/auth/v1/admin/users/${user_id}`, { method: 'DELETE', headers: H });
  if (!del.ok) return res.status(500).json({ error: 'no se pudo eliminar la cuenta' });

  async function delAll(table, filter) {
    await fetch(`${url}/rest/v1/${table}?${filter}`, { method: 'DELETE', headers: H }).catch(() => {});
  }

  await delAll('push_subscriptions', `user_id=eq.${user_id}`);
  await delAll('notifications', `user_id=eq.${user_id}`);
  await delAll('auction_bids', `bidder_id=eq.${user_id}`);
  await delAll('auctions', `owner_id=eq.${user_id}`);
  await delAll('auctions', `submissive_id=eq.${user_id}`);
  await delAll('chat_messages', `sender_id=eq.${user_id}`);

  const convs = await fetch(`${url}/rest/v1/conversations?or=(member_a.eq.${user_id},member_b.eq.${user_id})&select=id`, { headers: H }).then(r => r.json()).catch(() => []);
  if (Array.isArray(convs) && convs.length) {
    const ids = convs.map(c => c.id).join(',');
    await delAll('private_messages', `conversation_id=in.(${ids})`);
    await delAll('conversations', `id=in.(${ids})`);
  }

  const rels = await fetch(`${url}/rest/v1/relationships?or=(dominant_id.eq.${user_id},submissive_id.eq.${user_id})&select=id`, { headers: H }).then(r => r.json()).catch(() => []);
  if (Array.isArray(rels) && rels.length) {
    const rids = rels.map(r => r.id).join(',');
    const recs = await fetch(`${url}/rest/v1/submissive_records?relationship_id=in.(${rids})&select=id`, { headers: H }).then(r => r.json()).catch(() => []);
    if (Array.isArray(recs) && recs.length) {
      const recIds = recs.map(r => r.id).join(',');
      await delAll('cards', `record_id=in.(${recIds})`);
      await delAll('submissive_records', `id=in.(${recIds})`);
    }
    await delAll('discipline_entries', `relationship_id=in.(${rids})`);
    await delAll('relationships', `id=in.(${rids})`);
  }

  await delAll('discipline_entries', `created_by=eq.${user_id}`);
  await delAll('messaging_settings', `user_id=eq.${user_id}`);
  await delAll('app_moderators', `user_id=eq.${user_id}`);
  await delAll('profiles', `id=eq.${user_id}`);

  res.status(200).json({ ok: true });
}
