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

  const adm = await fetch(`${url}/rest/v1/app_admins?user_id=eq.${who.id}`, { headers: H }).then(r => r.json());
  const mod = await fetch(`${url}/rest/v1/app_moderators?user_id=eq.${who.id}`, { headers: H }).then(r => r.json());
  if (!((Array.isArray(adm) && adm.length) || (Array.isArray(mod) && mod.length)))
    return res.status(403).json({ error: 'sin facultades de staff' });

  const id = user_id;
  if (id === who.id) return res.status(400).json({ error: 'no puedes eliminarte a ti mismo desde aquí' });

  const tAdmin = await fetch(`${url}/rest/v1/app_admins?user_id=eq.${id}`, { headers: H }).then(r => r.json());
  if (Array.isArray(tAdmin) && tAdmin.length > 0) return res.status(400).json({ error: 'no puedes eliminar a una Administradora' });

  async function delAll(table, filter) {
    await fetch(`${url}/rest/v1/${table}?${filter}`, { method: 'DELETE', headers: H }).catch(() => {});
  }

  await delAll('push_subscriptions', `user_id=eq.${id}`);
  await delAll('notifications', `user_id=eq.${id}`);
  await delAll('messaging_settings', `user_id=eq.${id}`);
  await delAll('app_moderators', `user_id=eq.${id}`);
  await delAll('app_chat_mods', `user_id=eq.${id}`);
  await delAll('chat_self_nicknames', `user_id=eq.${id}`);
  await delAll('chat_assigned_nicknames', `target_user_id=eq.${id}`);
  await delAll('chat_assigned_nicknames', `assigned_by=eq.${id}`);
  await delAll('chat_media_pending', `user_id=eq.${id}`);
  await delAll('gallery_requests', `submissive_id=eq.${id}`);
  await delAll('gallery_photos', `owner_id=eq.${id}`);
  await delAll('auction_bids', `bidder_id=eq.${id}`);
  await delAll('auctions', `owner_id=eq.${id}`);
  await delAll('auctions', `submissive_id=eq.${id}`);
  await delAll('chat_messages', `user_id=eq.${id}`);
  await delAll('transfers', `or=(submissive_id.eq.${id},from_dominant_id.eq.${id},to_dominant_id.eq.${id})`);

  const convs = await fetch(`${url}/rest/v1/conversations?or=(member_a.eq.${id},member_b.eq.${id})&select=id`, { headers: H }).then(r => r.json()).catch(() => []);
  if (Array.isArray(convs) && convs.length) {
    const ids = convs.map(c => c.id).join(',');
    await delAll('private_messages', `conversation_id=in.(${ids})`);
    await delAll('conversations', `id=in.(${ids})`);
  }

  const rels = await fetch(`${url}/rest/v1/relationships?or=(dominant_id.eq.${id},submissive_id.eq.${id})&select=id`, { headers: H }).then(r => r.json()).catch(() => []);
  if (Array.isArray(rels) && rels.length) {
    const rids = rels.map(r => r.id).join(',');
    await delAll('contracts', `relationship_id=in.(${rids})`);
    const recs = await fetch(`${url}/rest/v1/submissive_records?relationship_id=in.(${rids})&select=id`, { headers: H }).then(r => r.json()).catch(() => []);
    if (Array.isArray(recs) && recs.length) {
      const recIds = recs.map(r => r.id).join(',');
      await delAll('cards', `record_id=in.(${recIds})`);
      await delAll('submissive_records', `id=in.(${recIds})`);
    }
    await delAll('discipline_entries', `relationship_id=in.(${rids})`);
    await delAll('relationships', `id=in.(${rids})`);
  }

  await delAll('discipline_entries', `created_by=eq.${id}`);
  await delAll('profiles', `id=eq.${id}`);

  const del = await fetch(`${url}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: H });
  if (!del.ok) return res.status(500).json({ error: 'no se pudo eliminar la cuenta' });

  res.status(200).json({ ok: true });
}
