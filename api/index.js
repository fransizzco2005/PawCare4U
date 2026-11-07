const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres.nbickxvumjpvqvmiiznj',
  password: process.env.SUPABASE_DB_PASSWORD || '',
  ssl: { rejectUnauthorized: false }
});

const secret = process.env.SESSION_SECRET || 'pawcare-v1-session-secret-change-me';

function json(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(body));
}

function cookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}

function sign(value) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verify(value) {
  try {
    const [payload, signature] = String(value || '').split('.');
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

async function body(req) {
  let text = '';
  try {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') text = req.body;
  } catch (_) {
    // Vercel's Node adapter may expose req.body as a throwing getter.
  }
  if (!text) for await (const chunk of req) text += chunk;
  const contentType = String(req.headers['content-type'] || '');
  if (contentType.includes('application/json')) return text ? JSON.parse(text) : {};
  if (contentType.includes('multipart/form-data')) {
    const boundary = contentType.split('boundary=')[1]?.trim();
    const fields = {};
    if (boundary && text) {
      for (const part of text.split(`--${boundary}`)) {
        const match = part.match(/name="([^"]+)"\r?\n\r?\n([\s\S]*?)\r?\n(?:--)?$/);
        if (match) fields[match[1]] = match[2].replace(/\r?\n$/, '');
      }
    }
    return fields;
  }
  return text ? JSON.parse(text) : {};
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  const pathname = url.pathname.replace(/^\/api\//, '').replace(/\.php$/, '');
  const c = cookies(req);
  const session = verify(c.pawcare_session);

  try {
    if (pathname === 'ping') return json(res, 200, { ok: true, runtime: 'node', backend: 'supabase' });
    if (pathname === 'health') {
      const result = await pool.query('SELECT COUNT(*)::int AS product_count FROM products');
      return json(res, 200, { ok: true, database: 'supabase', product_count: result.rows[0].product_count });
    }
    if (pathname === 'session') {
      if (!session) return json(res, 200, { user: null });
      if (session.role === 'owner') {
        const result = await pool.query('SELECT id, name, email FROM owners WHERE id = $1', [session.id]);
        return json(res, 200, { user: result.rows[0] ? { ...result.rows[0], role: 'owner' } : null });
      }
      const result = await pool.query('SELECT id, name, email, phone FROM users WHERE id = $1', [session.id]);
      return json(res, 200, { user: result.rows[0] ? { ...result.rows[0], role: 'user' } : null });
    }
    if (pathname === 'profile') {
      if (!session) return json(res, 401, { error: 'Please sign in first.' });
      if (req.method === 'GET') {
        const result = session.role === 'owner'
          ? await pool.query('SELECT id,name,email,profile_name,avatar_url FROM owners WHERE id=$1', [session.id])
          : await pool.query('SELECT id,name,email,phone,nickname,avatar_url FROM users WHERE id=$1', [session.id]);
        if (!result.rows[0]) return json(res, 401, { error: 'Please sign in first.' });
        return json(res, 200, { profile: { ...result.rows[0], role: session.role } });
      }
      if (req.method === 'POST') {
        const input = await body(req);
        if (session.role === 'owner') {
          const name = String(input.name || '').trim() || session.name;
          const nickname = String(input.nickname || '').trim();
          await pool.query('UPDATE owners SET name=$1, profile_name=$2 WHERE id=$3', [name, nickname, session.id]);
          const result = await pool.query('SELECT id,name,email,profile_name,avatar_url FROM owners WHERE id=$1', [session.id]);
          return json(res, 200, { ok: true, profile: { ...result.rows[0], role: 'owner' } });
        }
        const nickname = String(input.nickname || '').trim();
        if (nickname.length > 80) return json(res, 422, { error: 'Nickname is too long.' });
        await pool.query('UPDATE users SET nickname=$1 WHERE id=$2', [nickname, session.id]);
        const result = await pool.query('SELECT id,name,email,phone,nickname,avatar_url FROM users WHERE id=$1', [session.id]);
        return json(res, 200, { ok: true, profile: { ...result.rows[0], role: 'user' } });
      }
      return json(res, 405, { error: 'Method not allowed.' });
    }
    if (pathname === 'products' && req.method === 'GET') {
      const category = url.searchParams.get('category') || 'all';
      const search = url.searchParams.get('q') || '';
      const subcategory = url.searchParams.get('subcategory') || '';
      const values = [];
      const clauses = ['1=1'];
      if (category !== 'all') { values.push(category); clauses.push(`category = $${values.length}`); }
      if (subcategory) { values.push(subcategory); clauses.push(`subcategory = $${values.length}`); }
      if (search) {
        values.push(`%${search}%`, `%${search}%`);
        clauses.push(`(name ILIKE $${values.length - 1} OR subcategory ILIKE $${values.length})`);
      }
      const result = await pool.query(
        `SELECT id, name, category, subcategory, price, old_price AS "oldPrice", rating, reviews, tag, icon, stock, image_url FROM products WHERE ${clauses.join(' AND ')} ORDER BY id`,
        values
      );
      return json(res, 200, result.rows);
    }
    if (pathname === 'login' && req.method === 'POST') {
      const input = await body(req);
      const email = String(input.email || '').trim().toLowerCase();
      const password = String(input.password || '');
      const owner = await pool.query('SELECT id, name, email, password_hash FROM owners WHERE email = $1', [email]);
      if (owner.rows[0] && await bcrypt.compare(password, owner.rows[0].password_hash)) {
        const user = { id: owner.rows[0].id, name: owner.rows[0].name, email: owner.rows[0].email, role: 'owner' };
        return json(res, 200, { user }, { 'Set-Cookie': `pawcare_session=${sign(user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000` });
      }
      const customer = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
      if (!customer.rows[0] || !(await bcrypt.compare(password, customer.rows[0].password_hash))) {
        return json(res, 401, { error: 'Incorrect email or password.' });
      }
      const user = { id: customer.rows[0].id, name: customer.rows[0].name, email: customer.rows[0].email, role: 'user' };
      return json(res, 200, { user }, { 'Set-Cookie': `pawcare_session=${sign(user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000` });
    }
    if (pathname === 'register' && req.method === 'POST') {
      const input = await body(req);
      const name = String(input.name || '').trim();
      const email = String(input.email || '').trim().toLowerCase();
      const password = String(input.password || '');
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
        return json(res, 422, { error: 'Name, a valid email, and a password of at least 6 characters are required.' });
      }
      const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows[0]) return json(res, 409, { error: 'An account with that email already exists. Try signing in instead.' });
      const hash = await bcrypt.hash(password, 10);
      const created = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id,name,email', [name, email, hash]);
      const user = { ...created.rows[0], role: 'user' };
      return json(res, 200, { user }, { 'Set-Cookie': `pawcare_session=${sign(user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000` });
    }
    if (pathname === 'logout' && req.method === 'POST') {
      return json(res, 200, { ok: true }, { 'Set-Cookie': 'pawcare_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' });
    }
    if (pathname === 'cart') {
      const guest = c.pawcare_guest || crypto.randomBytes(16).toString('hex');
      const ownerClause = session && session.role === 'user' ? 'user_id = $1' : 'guest_token = $1';
      const ownerValue = session && session.role === 'user' ? session.id : guest;
      const cartRows = async () => {
        const result = await pool.query(
          `SELECT c.product_id, c.qty, p.name, p.price, p.icon, p.category, p.image_url FROM cart_items c JOIN products p ON p.id = c.product_id WHERE c.${ownerClause}`,
          [ownerValue]
        );
        return result.rows;
      };
      const headers = {};
      if (!c.pawcare_guest) headers['Set-Cookie'] = `pawcare_guest=${guest}; Path=/; SameSite=Lax; Max-Age=2592000`;
      if (req.method === 'GET') return json(res, 200, { items: await cartRows() }, headers);
      if (req.method === 'DELETE') {
        const input = await body(req);
        await pool.query(`DELETE FROM cart_items WHERE product_id = $1 AND ${ownerClause}`, [Number(input.product_id), ownerValue]);
        return json(res, 200, { items: await cartRows() }, headers);
      }
      if (req.method === 'POST') {
        const input = await body(req);
        const productId = Number(input.product_id || 0);
        if (!productId) return json(res, 422, { error: 'product_id is required.' });
        const existing = await pool.query(`SELECT id, qty FROM cart_items WHERE product_id = $1 AND ${ownerClause}`, [productId, ownerValue]);
        const qty = Number.isFinite(Number(input.qty)) ? Number(input.qty) : existing.rows[0]
          ? existing.rows[0].qty + (Number(input.delta) || 1)
          : 1;
        if (existing.rows[0]) {
          if (qty <= 0) await pool.query('DELETE FROM cart_items WHERE id = $1', [existing.rows[0].id]);
          else await pool.query('UPDATE cart_items SET qty = $1 WHERE id = $2', [qty, existing.rows[0].id]);
        } else if (qty > 0) {
          if (session && session.role === 'user') {
            await pool.query('INSERT INTO cart_items (product_id, qty, user_id) VALUES ($1,$2,$3)', [productId, qty, session.id]);
          } else {
            await pool.query('INSERT INTO cart_items (product_id, qty, guest_token) VALUES ($1,$2,$3)', [productId, qty, guest]);
          }
        }
        return json(res, 200, { items: await cartRows() }, headers);
      }
    }
    return json(res, 404, { error: 'API endpoint not found.' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Server request failed.' });
  }
};
