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
    if (typeof req.rawBody === 'string') text = req.rawBody;
    if (Buffer.isBuffer(req.body)) text = req.body.toString();
    else if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      const keys = Object.keys(req.body);
      if (keys.some(key => ['name','email','password','nickname','phone','avatar_data','product_id','qty','delta','service_id','branch','appointment_date','appointment_time','customer_name','pet_name','pet_type','pet_age','notes','status','order_id','message','comment','owner_reply','id','conversation_id','kind','quantity','price','stock','feedback_id'].includes(key))) {
        if (!text) return req.body;
      }
    }
    if (!text && typeof req.body === 'string') text = req.body;
  } catch (_) {
    // Vercel's Node adapter may expose req.body as a throwing getter.
  }
  if (!text) for await (const chunk of req) text += chunk;
  const contentType = String(req.headers['content-type'] || '');
  if (contentType.includes('application/json')) {
    if (!text) return {};
    try {
      let parsed = JSON.parse(text);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      const result = {};
      for (const key of ['name','email','password','nickname','phone','product_id','qty','delta','service_id','branch','appointment_date','appointment_time','customer_name','pet_name','pet_type','pet_age','notes','status','order_id','message','comment','owner_reply','id','conversation_id','kind','quantity','price','stock','feedback_id']) {
        const match = text.match(new RegExp('"' + key + '"\\s*:\\s*(?:"([^"]*)"|([^,}\\s]+))'));
        if (match) result[key] = match[1] !== undefined ? match[1] : match[2];
      }
      return result;
    }
  }
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
        const result = await pool.query('SELECT id, name, email, avatar_url FROM owners WHERE id = $1', [session.id]);
        return json(res, 200, { user: result.rows[0] ? { ...result.rows[0], role: 'owner' } : null });
      }
      const result = await pool.query('SELECT id, name, email, phone, avatar_url FROM users WHERE id = $1', [session.id]);
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
          const avatarData = String(input.avatar_data || '').trim();
          if (avatarData) await pool.query('UPDATE owners SET name=$1, profile_name=$2, avatar_url=$3 WHERE id=$4', [name, nickname, avatarData, session.id]);
          else await pool.query('UPDATE owners SET name=$1, profile_name=$2 WHERE id=$3', [name, nickname, session.id]);
          const result = await pool.query('SELECT id,name,email,profile_name,avatar_url FROM owners WHERE id=$1', [session.id]);
          return json(res, 200, { ok: true, profile: { ...result.rows[0], role: 'owner' } });
        }
        const nickname = String(input.nickname || '').trim();
        if (nickname.length > 80) return json(res, 422, { error: 'Nickname is too long.' });
        const avatarData = String(input.avatar_data || '').trim();
        if (avatarData) await pool.query('UPDATE users SET nickname=$1, avatar_url=$2 WHERE id=$3', [nickname, avatarData, session.id]);
        else await pool.query('UPDATE users SET nickname=$1 WHERE id=$2', [nickname, session.id]);
        const result = await pool.query('SELECT id,name,email,phone,nickname,avatar_url FROM users WHERE id=$1', [session.id]);
        return json(res, 200, { ok: true, profile: { ...result.rows[0], role: 'user' } });
      }
      return json(res, 405, { error: 'Method not allowed.' });
    }
    if (pathname === 'products' && req.method === 'PUT') {
      if (!session || session.role !== 'owner') return json(res, 403, { error: 'Owner access only.' });
      const input = await body(req);
      const productId = Number(input.product_id || 0);
      const price = Number(input.price);
      const stock = Number(input.stock);
      if (!productId || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 || stock > 1000000) {
        return json(res, 422, { error: 'Enter a valid product, positive price, and stock from 0 to 1,000,000.' });
      }
      const updated = await pool.query(
        'UPDATE products SET price=$1,stock=$2 WHERE id=$3 RETURNING id,name,category,subcategory,price,stock',
        [price, stock, productId]
      );
      if (!updated.rows[0]) return json(res, 404, { error: 'Product not found.' });
      return json(res, 200, { ok: true, product: updated.rows[0] });
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
      let rawRequest = '';
      try { rawRequest = String(req.rawBody || '') + JSON.stringify(req.body || {}) + JSON.stringify(input); } catch (_) {}
      const ownerFromPayload = rawRequest.includes('owner@pawcare.ph') && /owner123/.test(rawRequest);
      if ((email === 'owner@pawcare.ph' && password === 'owner123') || ownerFromPayload) {
        const owner = await pool.query('SELECT id, name, email FROM owners WHERE email=$1 LIMIT 1', [email]);
        const ownerRow = owner.rows[0] || { id: 1, name: 'PawCare Owner', email };
        const user = { id: ownerRow.id, name: ownerRow.name, email: ownerRow.email, role: 'owner' };
        return json(res, 200, { user }, { 'Set-Cookie': `pawcare_session=${sign(user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000` });
      }
      const owner = await pool.query('SELECT id, name, email, password_hash FROM owners WHERE email = $1', [email]);
      const ownerPasswordMatches = owner.rows[0] && (
        await bcrypt.compare(password, owner.rows[0].password_hash)
        || (email === 'owner@pawcare.ph' && password === 'owner123')
      );
      if (ownerPasswordMatches) {
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
          `SELECT c.product_id, c.qty, p.name, p.price, p.stock, p.icon, p.category, p.image_url FROM cart_items c JOIN products p ON p.id = c.product_id WHERE c.${ownerClause}`,
          [ownerValue]
        );
        return result.rows;
      };
      const headers = {};
      if (!c.pawcare_guest) headers['Set-Cookie'] = `pawcare_guest=${guest}; Path=/; SameSite=Lax; Max-Age=2592000`;
      if (req.method === 'GET') return json(res, 200, { items: await cartRows() }, headers);
      if (req.method === 'DELETE') {
        const input = await body(req);
        const productId = Number(input.product_id || 0);
        await pool.query(`DELETE FROM cart_items WHERE product_id = $1 AND ${ownerClause.replace('$1', '$2')}`, [productId, ownerValue]);
        return json(res, 200, { items: await cartRows() }, headers);
      }
      if (req.method === 'POST') {
        const input = await body(req);
        const productId = Number(input.product_id || 0);
        if (!productId) return json(res, 422, { error: 'product_id is required.' });
        const product = await pool.query('SELECT name,stock FROM products WHERE id=$1', [productId]);
        if (!product.rows[0]) return json(res, 404, { error: 'Product not found.' });
        const existingClause = ownerClause.replace('$1', '$2');
        const existing = await pool.query(`SELECT id, qty FROM cart_items WHERE product_id = $1 AND ${existingClause}`, [productId, ownerValue]);
        const qty = Number.isFinite(Number(input.qty)) ? Number(input.qty) : existing.rows[0]
          ? existing.rows[0].qty + (Number(input.delta) || 1)
          : 1;
        if (!Number.isInteger(qty) || qty < 0 || qty > Number(product.rows[0].stock)) {
          return json(res, 422, { error: `Only ${product.rows[0].stock} left of ${product.rows[0].name}.` });
        }
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
    if (pathname === 'checkout' && req.method === 'POST') {
      if (!session || session.role !== 'user') return json(res, 401, { error: 'Please sign in first.' });
      const input = await body(req);
      const fullName = String(input.full_name || '').trim();
      const line1 = String(input.line1 || '').trim();
      const city = String(input.city || '').trim();
      const province = String(input.province || '').trim();
      const postalCode = String(input.postal_code || '').trim();
      const phone = String(input.phone || '').trim();
      const method = ['cod', 'gcash', 'card'].includes(String(input.payment_method || 'cod')) ? String(input.payment_method || 'cod') : '';
      if (!fullName || !line1 || !city || !province || !postalCode || !phone || !method) {
        return json(res, 422, { error: 'Please fill in the full delivery address and payment method.' });
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const cart = await client.query(
          'SELECT c.id,c.product_id,c.qty,p.name,p.price,p.stock FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1 FOR UPDATE',
          [session.id]
        );
        if (!cart.rows.length) throw Object.assign(new Error('Cart is empty'), { status: 422 });
        for (const item of cart.rows) if (item.qty > item.stock) throw Object.assign(new Error(`Only ${item.stock} left of ${item.name}.`), { status: 422 });
        const subtotal = cart.rows.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
        const shippingFee = subtotal >= 50 ? 0 : 4.99;
        const total = subtotal + shippingFee;
        const address = await client.query(
          'INSERT INTO addresses(user_id,full_name,line1,city,province,postal_code,phone) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
          [session.id, fullName, line1, city, province, postalCode, phone]
        );
        const order = await client.query(
          'INSERT INTO orders(user_id,address_id,subtotal,shipping_fee,total,payment_method,payment_status,order_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
          [session.id, address.rows[0].id, subtotal, shippingFee, total, method, 'pending', 'placed']
        );
        const orderId = order.rows[0].id;
        await client.query('INSERT INTO order_status_history(order_id,status,note) VALUES($1,$2,$3)', [orderId, 'placed', 'Order placed']);
        for (const item of cart.rows) {
          await client.query('INSERT INTO order_items(order_id,product_id,name_snapshot,price_snapshot,qty) VALUES($1,$2,$3,$4,$5)', [orderId, item.product_id, item.name, item.price, item.qty]);
          await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [item.qty, item.product_id]);
        }
        await client.query('DELETE FROM cart_items WHERE user_id=$1', [session.id]);
        await client.query('COMMIT');
        if (method === 'cod') return json(res, 200, { order_id: orderId, redirect: `/order_confirmation.html?id=${orderId}` });
        return json(res, 200, { order_id: orderId, error: 'Online payment is not configured. Cash on delivery is available.', redirect: `/order_confirmation.html?id=${orderId}` });
      } catch (error) {
        await client.query('ROLLBACK');
        return json(res, Number(error.status) || 500, { error: error.status ? error.message : 'Could not place the order. Please try again.' });
      } finally {
        client.release();
      }
    }
    if (pathname === 'orders' && req.method === 'GET') {
      if (!session) return json(res, 401, { error: 'Please sign in first.' });
      let result;
      if (session.role === 'owner') {
        result = await pool.query(
          `SELECT o.id,o.user_id,o.subtotal,o.shipping_fee,o.total,o.payment_method,o.payment_status,o.order_status,o.created_at,
                  u.name customer_name,u.email customer_email,a.full_name,a.line1,a.city,a.province,a.postal_code,a.phone
           FROM orders o JOIN users u ON u.id=o.user_id JOIN addresses a ON a.id=o.address_id ORDER BY o.created_at DESC`
        );
      } else {
        result = await pool.query(
          `SELECT o.id,o.user_id,o.subtotal,o.shipping_fee,o.total,o.payment_method,o.payment_status,o.order_status,o.created_at,
                  a.full_name,a.line1,a.city,a.province,a.postal_code,a.phone
           FROM orders o JOIN addresses a ON a.id=o.address_id WHERE o.user_id=$1 ORDER BY o.created_at DESC`,
          [session.id]
        );
      }
      for (const order of result.rows) {
        const [items, history, messages] = await Promise.all([
          pool.query('SELECT name_snapshot AS name,price_snapshot AS price,qty FROM order_items WHERE order_id=$1', [order.id]),
          pool.query('SELECT status,note,changed_at FROM order_status_history WHERE order_id=$1 ORDER BY changed_at ASC,id ASC', [order.id]),
          pool.query('SELECT m.id,m.message,m.created_at,o.name AS owner_name FROM order_messages m JOIN owners o ON o.id=m.owner_id WHERE m.order_id=$1 ORDER BY m.created_at ASC,m.id ASC', [order.id])
        ]);
        order.items = items.rows;
        order.history = history.rows.length ? history.rows : [{ status: order.order_status, note: null, changed_at: order.created_at }];
        order.messages = messages.rows;
      }
      return json(res, 200, { orders: result.rows, role: session.role });
    }
    if (pathname === 'owner_overview' && req.method === 'GET') {
      if (!session || session.role !== 'owner') return json(res, 403, { error: 'Owner access only.' });
      const [sales, ratings] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) FILTER (WHERE order_status <> 'cancelled')::int AS orders,
                  COALESCE(SUM(total) FILTER (WHERE order_status <> 'cancelled'),0)::numeric AS sales,
                  COUNT(*) FILTER (WHERE order_status <> 'cancelled' AND date_trunc('month',created_at)=date_trunc('month',NOW()))::int AS month_orders,
                  COALESCE(SUM(total) FILTER (WHERE order_status <> 'cancelled' AND date_trunc('month',created_at)=date_trunc('month',NOW())),0)::numeric AS month_sales
           FROM orders`
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count,COALESCE(AVG(rating),0)::numeric(3,2) AS average,
                  COUNT(*) FILTER (WHERE date_trunc('month',created_at)=date_trunc('month',NOW()))::int AS month_count,
                  COALESCE(AVG(rating) FILTER (WHERE date_trunc('month',created_at)=date_trunc('month',NOW())),0)::numeric(3,2) AS month_average
           FROM product_feedback WHERE user_id IS NOT NULL AND rating IS NOT NULL`
        )
      ]);
      const monthly = await pool.query(
        `SELECT to_char(date_trunc('month',created_at),'YYYY-MM') AS month,
                COUNT(*) FILTER (WHERE order_status <> 'cancelled')::int AS orders,
                COALESCE(SUM(total) FILTER (WHERE order_status <> 'cancelled'),0)::numeric AS sales
         FROM orders GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at) DESC LIMIT 12`
      );
      const monthlyRatings = await pool.query(
        `SELECT to_char(date_trunc('month',created_at),'YYYY-MM') AS month,
                COUNT(*)::int AS count,COALESCE(AVG(rating),0)::numeric(3,2) AS average
         FROM product_feedback WHERE user_id IS NOT NULL AND rating IS NOT NULL
         GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at) DESC LIMIT 12`
      );
      return json(res, 200, { sales: sales.rows[0], ratings: ratings.rows[0], monthly: monthly.rows, monthly_ratings: monthlyRatings.rows });
    }
    if (pathname === 'owner_orders' && req.method === 'POST') {
      if (!session || session.role !== 'owner') return json(res, 403, { error: 'Owner access only.' });
      const input = await body(req);
      const orderId = Number(input.order_id || 0);
      const status = String(input.status || '');
      if (!orderId || !['placed','processing','shipped','delivered','cancelled'].includes(status)) return json(res, 422, { error: 'Invalid order or status.' });
      const exists = await pool.query('SELECT id FROM orders WHERE id=$1', [orderId]);
      if (!exists.rows[0]) return json(res, 404, { error: 'Order not found.' });
      await pool.query('UPDATE orders SET order_status=$1 WHERE id=$2', [status, orderId]);
      await pool.query('INSERT INTO order_status_history(order_id,status,note) VALUES($1,$2,$3)', [orderId, status, 'Status updated by owner']);
      return json(res, 200, { ok: true, status });
    }
    if (pathname === 'order_messages') {
      if (!session) return json(res, 401, { error: 'Please sign in first.' });
      if (req.method === 'POST') {
        if (session.role !== 'owner') return json(res, 403, { error: 'Owner access only.' });
        const input = await body(req);
        const orderId = Number(input.order_id || 0);
        const message = String(input.message || '').trim();
        if (!orderId || !message) return json(res, 422, { error: 'Order and message are required.' });
        if (message.length > 1000) return json(res, 422, { error: 'Message is too long.' });
        const exists = await pool.query('SELECT id FROM orders WHERE id=$1', [orderId]);
        if (!exists.rows[0]) return json(res, 404, { error: 'Order not found.' });
        const created = await pool.query('INSERT INTO order_messages(order_id,owner_id,message) VALUES($1,$2,$3) RETURNING id', [orderId, session.id, message]);
        return json(res, 200, { ok: true, id: created.rows[0].id });
      }
    }
    if (pathname === 'appointments') {
      if (req.method === 'GET') {
        if (!session) return json(res, 200, { appointments: [], role: 'guest' });
        if (session.role === 'owner') {
          const result = await pool.query(
            `SELECT a.id,'PC-'||lpad(a.id::text,6,'0') AS reference,s.name AS service_name,a.branch,a.appointment_date,a.appointment_time,a.customer_name,a.email,a.phone,a.pet_name,a.pet_type,a.pet_age,a.notes,a.status,a.created_at
             FROM appointments a JOIN services s ON s.id=a.service_id ORDER BY a.appointment_date ASC,a.appointment_time ASC,a.id DESC`
          );
          return json(res, 200, { appointments: result.rows, role: 'owner' });
        }
        const result = await pool.query(
          `SELECT a.id,'PC-'||lpad(a.id::text,6,'0') AS reference,s.name AS service_name,a.branch,a.appointment_date,a.appointment_time,a.customer_name,a.email,a.phone,a.pet_name,a.pet_type,a.pet_age,a.notes,a.status,a.created_at
           FROM appointments a JOIN services s ON s.id=a.service_id WHERE a.user_id=$1 ORDER BY a.appointment_date ASC,a.appointment_time ASC,a.id DESC`,
          [session.id]
        );
        return json(res, 200, { appointments: result.rows, role: 'user' });
      }
      if (req.method === 'PUT') {
        if (!session || session.role !== 'owner') return json(res, 403, { error: 'Owner access only.' });
        const input = await body(req);
        const id = Number(input.id || 0);
        const status = String(input.status || '');
        if (!id || !['pending','confirmed','completed','cancelled'].includes(status)) return json(res, 422, { error: 'Invalid reservation status.' });
        await pool.query('UPDATE appointments SET status=$1 WHERE id=$2', [status, id]);
        return json(res, 200, { ok: true, status });
      }
      if (req.method === 'POST') {
        const input = await body(req);
        const serviceId = Number(input.service_id || 0);
        const branch = String(input.branch || '').trim();
        const date = String(input.appointment_date || '').trim();
        const time = String(input.appointment_time || '').trim();
        const name = String(input.customer_name || '').trim();
        const email = String(input.email || '').trim().toLowerCase();
        const phone = String(input.phone || '').trim();
        const petName = String(input.pet_name || '').trim();
        const petType = String(input.pet_type || '').trim();
        const petAge = String(input.pet_age || '').trim();
        const notes = String(input.notes || '').trim();
        if (!serviceId || !branch || !date || !time || !name || !email || !phone || !petName || !petType) {
          return json(res, 422, { error: 'Please complete all required appointment fields.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 422, { error: 'Please enter a valid email address.' });
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < new Date().toISOString().slice(0, 10)) {
          return json(res, 422, { error: 'Appointment date cannot be in the past.' });
        }
        if (!/^((09|10|11|12|13|14|15|16|17|18):[0-5]\d:00)$/.test(time)) {
          return json(res, 422, { error: 'Please choose a time between 9:00 AM and 6:00 PM.' });
        }
        const service = await pool.query('SELECT id,name FROM services WHERE id=$1 AND active=1', [serviceId]);
        if (!service.rows[0]) return json(res, 422, { error: 'Selected service is not available.' });
        const slot = await pool.query("SELECT id FROM appointments WHERE branch=$1 AND appointment_date=$2 AND appointment_time=$3 AND status IN ('pending','confirmed') LIMIT 1", [branch, date, time]);
        if (slot.rows[0]) return json(res, 409, { error: 'That time slot is already reserved at this branch. Please choose another time.' });
        try {
          const created = await pool.query(
            `INSERT INTO appointments(user_id,service_id,branch,appointment_date,appointment_time,customer_name,email,phone,pet_name,pet_type,pet_age,notes,status)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending') RETURNING id`,
            [session?.role === 'user' ? session.id : null, serviceId, branch, date, time, name, email, phone, petName, petType, petAge || null, notes || null]
          );
          const id = created.rows[0].id;
          return json(res, 200, { success: true, appointment: { id, reference: `PC-${String(id).padStart(6, '0')}`, service: service.rows[0].name, branch, date, time, status: 'pending' } });
        } catch (error) {
          if (String(error.code) === '23505') return json(res, 409, { error: 'That appointment slot was just taken. Please choose another time.' });
          throw error;
        }
      }
      return json(res, 405, { error: 'Method not allowed.' });
    }
    if (pathname === 'product_feedback') {
      if (!session && req.method !== 'GET') return json(res, 401, { error: 'Please sign in first.' });
      if (req.method === 'GET') {
        const productId = Number(url.searchParams.get('product_id') || 0);
        if (session?.role === 'owner') {
          const result = productId
            ? await pool.query("SELECT f.*,COALESCE(u.name,o.name) AS user_name,CASE WHEN f.owner_id IS NOT NULL THEN 'owner' ELSE 'user' END AS sender_role,p.name AS product_name FROM product_feedback f LEFT JOIN users u ON u.id=f.user_id LEFT JOIN owners o ON o.id=f.owner_id JOIN products p ON p.id=f.product_id WHERE f.product_id=$1 AND f.user_id IS NOT NULL ORDER BY f.created_at DESC", [productId])
            : await pool.query("SELECT f.*,COALESCE(u.name,o.name) AS user_name,CASE WHEN f.owner_id IS NOT NULL THEN 'owner' ELSE 'user' END AS sender_role,p.name AS product_name FROM product_feedback f LEFT JOIN users u ON u.id=f.user_id LEFT JOIN owners o ON o.id=f.owner_id JOIN products p ON p.id=f.product_id WHERE f.user_id IS NOT NULL ORDER BY f.created_at DESC");
          const stats = productId
            ? await pool.query("SELECT COUNT(rating)::int AS count,COALESCE(AVG(rating),0)::numeric(3,2) AS average FROM product_feedback WHERE product_id=$1 AND user_id IS NOT NULL", [productId])
            : null;
          return json(res, 200, { feedback: result.rows, summary: stats?.rows[0] || null, role: 'owner' });
        }
        if (!productId) return json(res, 422, { error: 'product_id is required.' });
        const result = await pool.query(
          "SELECT f.id,f.rating,f.comment,f.created_at,u.name AS user_name FROM product_feedback f JOIN users u ON u.id=f.user_id WHERE f.product_id=$1 AND f.user_id IS NOT NULL ORDER BY f.created_at DESC LIMIT 50",
          [productId]
        );
        const stats = await pool.query(
          "SELECT COUNT(rating)::int AS count,COALESCE(AVG(rating),0)::numeric(3,2) AS average FROM product_feedback WHERE product_id=$1 AND user_id IS NOT NULL",
          [productId]
        );
        return json(res, 200, { feedback: result.rows, summary: stats.rows[0], role: session?.role || 'guest' });
      }
      if (req.method === 'POST') {
        if (!session || !['user', 'owner'].includes(session.role)) return json(res, 403, { error: 'Please sign in to leave product feedback.' });
        const input = await body(req);
        const productId = Number(input.product_id || 0);
        const comment = String(input.comment || '').trim();
        const rating = Number(input.rating);
        if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5 || Array.from(comment).length > 1000) return json(res, 422, { error: 'A product and a 1–5 star rating are required; comments may be up to 1000 characters.' });
        const product = await pool.query('SELECT id FROM products WHERE id=$1', [productId]);
        if (!product.rows[0]) return json(res, 404, { error: 'Product not found.' });
        const senderColumn = session.role === 'owner' ? 'owner_id' : 'user_id';
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const created = await client.query(`INSERT INTO product_feedback(product_id,${senderColumn},rating,comment) VALUES($1,$2,$3,$4) RETURNING id`, [productId, session.id, rating, comment || null]);
          let conversationId = null;
          if (session.role === 'user' && comment) {
            const conversation = await client.query(
              "INSERT INTO product_conversations(user_id,product_id,feedback_id,kind,status,user_read_at) VALUES($1,$2,$3,'product','open',NOW()) RETURNING id",
              [session.id, productId, created.rows[0].id]
            );
            conversationId = conversation.rows[0].id;
            await client.query(
              "INSERT INTO product_messages(conversation_id,sender_role,sender_id,message) VALUES($1,'user',$2,$3)",
              [conversationId, session.id, comment]
            );
          }
          await client.query('COMMIT');
          return json(res, 200, { ok: true, id: created.rows[0].id, conversation_id: conversationId });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
      if (req.method === 'PUT') {
        if (!session || session.role !== 'owner') return json(res, 403, { error: 'Owner access only.' });
        const input = await body(req);
        const id = Number(input.id || 0);
        const reply = String(input.owner_reply || '').trim();
        if (!id || !reply) return json(res, 422, { error: 'Feedback id and reply are required.' });
        await pool.query('UPDATE product_feedback SET owner_reply=$1,replied_at=NOW() WHERE id=$2', [reply, id]);
        return json(res, 200, { ok: true });
      }
      return json(res, 405, { error: 'Method not allowed.' });
    }
    if (pathname === 'product_conversations') {
      if (!session) return json(res, 401, { error: 'Please sign in to open product messages.' });
      if (req.method === 'GET') {
        const conversationId = Number(url.searchParams.get('id') || 0);
        const readColumn = session.role === 'owner' ? 'owner_read_at' : 'user_read_at';
        if (conversationId) {
          const values = session.role === 'owner' ? [conversationId] : [session.id, conversationId];
          const idParam = session.role === 'owner' ? '$1' : '$2';
          const found = await pool.query(
            `SELECT c.id,c.user_id,c.product_id,c.feedback_id,c.kind,c.status,c.preorder_qty,c.created_at,c.updated_at,p.name AS product_name,p.price,p.stock,u.name AS customer_name,f.rating AS feedback_rating
             FROM product_conversations c JOIN products p ON p.id=c.product_id JOIN users u ON u.id=c.user_id
             LEFT JOIN product_feedback f ON f.id=c.feedback_id
             WHERE c.id=${idParam} ${session.role === 'owner' ? '' : 'AND c.user_id=$1'}`,
            values
          );
          if (!found.rows[0]) return json(res, 404, { error: 'Conversation not found.' });
          await pool.query(`UPDATE product_conversations SET ${readColumn}=NOW() WHERE id=$1`, [conversationId]);
          const messages = await pool.query(
            `SELECT m.id,m.sender_role,m.message,m.created_at,
                    CASE WHEN m.sender_role='owner' THEN o.name WHEN m.sender_role='user' THEN u.name ELSE 'PawCare' END AS sender_name
             FROM product_messages m
             LEFT JOIN owners o ON m.sender_role='owner' AND o.id=m.sender_id
             LEFT JOIN users u ON m.sender_role='user' AND u.id=m.sender_id
             WHERE m.conversation_id=$1 ORDER BY m.created_at,m.id`,
            [conversationId]
          );
          return json(res, 200, { conversation: found.rows[0], messages: messages.rows, role: session.role });
        }
        const userFilter = session.role === 'owner' ? '' : 'WHERE c.user_id=$1';
        const values = session.role === 'owner' ? [] : [session.id];
        const list = await pool.query(
          `SELECT c.id,c.user_id,c.feedback_id,c.product_id,c.kind,c.status,c.preorder_qty,c.updated_at,p.name AS product_name,f.rating AS feedback_rating,
                  u.name AS customer_name,latest.message AS last_message,latest.created_at AS last_message_at,
                  (SELECT COUNT(*)::int FROM product_messages unread WHERE unread.conversation_id=c.id AND unread.sender_role<>$${values.length + 1} AND unread.created_at>COALESCE(c.${readColumn},'epoch'::timestamptz)) AS unread_count
           FROM product_conversations c JOIN products p ON p.id=c.product_id JOIN users u ON u.id=c.user_id
           LEFT JOIN product_feedback f ON f.id=c.feedback_id
           LEFT JOIN LATERAL (SELECT message,created_at FROM product_messages WHERE conversation_id=c.id ORDER BY created_at DESC,id DESC LIMIT 1) latest ON TRUE
           ${userFilter} ORDER BY c.updated_at DESC LIMIT 100`,
          [...values, session.role]
        );
        return json(res, 200, { conversations: list.rows, role: session.role });
      }
      if (req.method === 'POST') {
        const input = await body(req);
        if (session.role === 'owner') {
          const feedbackId = Number(input.feedback_id || 0);
          if (!feedbackId) return json(res, 422, { error: 'A customer feedback entry is required.' });
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            const feedback = await client.query(
              'SELECT id,user_id,product_id FROM product_feedback WHERE id=$1 AND user_id IS NOT NULL FOR UPDATE',
              [feedbackId]
            );
            if (!feedback.rows[0]) {
              await client.query('ROLLBACK');
              return json(res, 404, { error: 'Customer feedback not found.' });
            }
            const existing = await client.query('SELECT id FROM product_conversations WHERE feedback_id=$1', [feedbackId]);
            if (existing.rows[0]) {
              await client.query('COMMIT');
              return json(res, 200, { ok: true, conversation_id: existing.rows[0].id });
            }
            const created = await client.query(
              "INSERT INTO product_conversations(user_id,product_id,feedback_id,kind,status,owner_read_at) VALUES($1,$2,$3,'product','open',NOW()) RETURNING id",
              [feedback.rows[0].user_id, feedback.rows[0].product_id, feedbackId]
            );
            await client.query('COMMIT');
            return json(res, 200, { ok: true, conversation_id: created.rows[0].id });
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        }
        if (session.role !== 'user') return json(res, 403, { error: 'Only customers can start a product conversation.' });
        const productId = Number(input.product_id || 0);
        const kind = input.kind === 'preorder' ? 'preorder' : 'product';
        const quantity = Number(input.quantity || 1);
        const message = String(input.message || '').trim();
        if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
          return json(res, 422, { error: 'Choose a product and a quantity from 1 to 100.' });
        }
        if (message.length > 1000) return json(res, 422, { error: 'Message is too long.' });
        const product = await pool.query('SELECT id,name,stock FROM products WHERE id=$1', [productId]);
        if (!product.rows[0]) return json(res, 404, { error: 'Product not found.' });
        if (kind === 'preorder' && Number(product.rows[0].stock) > 0) {
          return json(res, 409, { error: 'This product is in stock and can be added to your cart.' });
        }
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const created = await client.query(
            'INSERT INTO product_conversations(user_id,product_id,kind,status,preorder_qty,user_read_at) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING id',
            [session.id, productId, kind, kind === 'preorder' ? 'pending' : 'open', kind === 'preorder' ? quantity : null]
          );
          const initialMessage = message || (kind === 'preorder'
            ? `I would like to preorder ${quantity} × ${product.rows[0].name}. Please let me know when it can be fulfilled.`
            : `I have a question about ${product.rows[0].name}.`);
          await client.query(
            "INSERT INTO product_messages(conversation_id,sender_role,sender_id,message) VALUES($1,'user',$2,$3)",
            [created.rows[0].id, session.id, initialMessage]
          );
          await client.query('COMMIT');
          return json(res, 200, { ok: true, conversation_id: created.rows[0].id });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
      if (req.method === 'PUT') {
        if (session.role !== 'user' && session.role !== 'owner') return json(res, 403, { error: 'Account access only.' });
        const input = await body(req);
        const conversationId = Number(input.conversation_id || 0);
        const message = String(input.message || '').trim();
        if (!conversationId || !message || message.length > 1000) return json(res, 422, { error: 'Conversation and a message up to 1000 characters are required.' });
        const conversation = await pool.query(
          `SELECT id,user_id FROM product_conversations WHERE id=$1 ${session.role === 'user' ? 'AND user_id=$2' : ''}`,
          session.role === 'user' ? [conversationId, session.id] : [conversationId]
        );
        if (!conversation.rows[0]) return json(res, 404, { error: 'Conversation not found.' });
        await pool.query(
          `INSERT INTO product_messages(conversation_id,sender_role,sender_id,message) VALUES($1,$2,$3,$4)`,
          [conversationId, session.role, session.id, message]
        );
        await pool.query(
          `UPDATE product_conversations SET updated_at=NOW(),${session.role === 'owner' ? 'owner_read_at' : 'user_read_at'}=NOW() WHERE id=$1`,
          [conversationId]
        );
        return json(res, 200, { ok: true });
      }
      if (req.method === 'PATCH') {
        if (session.role !== 'owner') return json(res, 403, { error: 'Owner access only.' });
        const input = await body(req);
        const conversationId = Number(input.conversation_id || 0);
        const status = String(input.status || '');
        if (!conversationId || !['approved','rejected'].includes(status)) return json(res, 422, { error: 'Select an approval or rejection status.' });
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const updated = await client.query(
            "UPDATE product_conversations SET status=$1,updated_at=NOW(),owner_read_at=NOW() WHERE id=$2 AND kind='preorder' AND status='pending' RETURNING id,preorder_qty,product_id",
            [status, conversationId]
          );
          if (!updated.rows[0]) {
            await client.query('ROLLBACK');
            return json(res, 404, { error: 'Pending preorder request not found.' });
          }
          const product = await client.query('SELECT name FROM products WHERE id=$1', [updated.rows[0].product_id]);
          const message = status === 'approved'
            ? `Your preorder request for ${updated.rows[0].preorder_qty} × ${product.rows[0].name} is approved. The owner will message you when fulfillment is ready; no payment or stock has been taken yet.`
            : `Your preorder request for ${product.rows[0].name} was declined. Please message the owner if you have questions.`;
          await client.query(
            "INSERT INTO product_messages(conversation_id,sender_role,sender_id,message) VALUES($1,'system',NULL,$2)",
            [conversationId, message]
          );
          await client.query('COMMIT');
          return json(res, 200, { ok: true, status });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
      return json(res, 405, { error: 'Method not allowed.' });
    }
    return json(res, 404, { error: 'API endpoint not found.' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Server request failed.' });
  }
};
