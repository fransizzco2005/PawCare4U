/* =========================================================
   FurCare — app logic
   ========================================================= */

/* ---------- FALLBACK PRODUCT DATA ---------- */
const CAT_IMG = {
  dog:   n => 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 800 800\"><rect width=\"800\" height=\"800\" fill=\"#05080d\"/><rect x=\"120\" y=\"120\" width=\"560\" height=\"560\" rx=\"36\" fill=\"#0b111a\"/><path d=\"M245 500h310\" stroke=\"#1c2b40\" stroke-width=\"8\" stroke-linecap=\"round\"/><text x=\"400\" y=\"405\" text-anchor=\"middle\" fill=\"#8ca4c2\" font-family=\"Arial\" font-size=\"26\" letter-spacing=\"6\">PAWCARE</text><text x=\"400\" y=\"455\" text-anchor=\"middle\" fill=\"#536a87\" font-family=\"Arial\" font-size=\"16\" letter-spacing=\"3\">PRODUCT IMAGE</text></svg>'),
  cat:   n => productPlaceholder(),
  bird:  n => productPlaceholder(),
  fish:  n => productPlaceholder(),
  rodent:n => productPlaceholder(),
};

const FALLBACK_PRODUCTS = [
  { id:1,  name:'Grain-Inclusive Adult Dry Formula 12kg',     category:'dog', stage:'adult-dog',  price:8.43,  oldPrice:null,  rating:4.5, reviews:128, tag:'top',  isNew:false },
  { id:2,  name:'High-Protein Adult Kibble, Chicken',         category:'dog', stage:'adult-dog',  price:19.95, oldPrice:24.95, rating:4.5, reviews:161, tag:'sale', isNew:false },
  { id:3,  name:'Rubber Chew & Enrichment Toy Set',           category:'dog', stage:'all',        price:8.43,  oldPrice:null,  rating:4.6, reviews:57,  tag:null,   isNew:false },
  { id:4,  name:'Lamb & Rice Grain-Free Formula 3kg',         category:'dog', stage:'adult-dog',  price:29.90, oldPrice:null,  rating:4.5, reviews:129, tag:null,   isNew:true },
  { id:5,  name:'Full-Grain Leather Walking Leash',           category:'dog', stage:'all',        price:14.20, oldPrice:null,  rating:4.7, reviews:44,  tag:'new',  isNew:true },
  { id:6,  name:'Orthopedic Support Bed — Large',              category:'dog', stage:'senior-dog', price:38.00, oldPrice:46.00, rating:4.8, reviews:96,  tag:'sale', isNew:false },
  { id:7,  name:'Small-Breed Puppy Starter Kibble 2kg',       category:'dog', stage:'puppy',      price:16.50, oldPrice:null,  rating:4.6, reviews:71,  tag:null,   isNew:true },
  { id:8,  name:'Joint & Mobility Senior Supplement',         category:'dog', stage:'senior-dog', price:21.00, oldPrice:null,  rating:4.4, reviews:38,  tag:null,   isNew:false },
  { id:9,  name:'Salmon Pouches in Gravy, Adult',             category:'cat', stage:'adult-cat',  price:6.95,  oldPrice:null,  rating:4.4, reviews:88,  tag:null,   isNew:false },
  { id:10, name:'Feather Teaser Wand',                        category:'cat', stage:'all',        price:4.50,  oldPrice:null,  rating:4.6, reviews:73,  tag:'top',  isNew:false },
  { id:11, name:'Ultra-Clumping Cat Litter 10L',              category:'cat', stage:'all',        price:11.30, oldPrice:13.90, rating:4.3, reviews:150, tag:'sale', isNew:false },
  { id:12, name:'Scratching Post Tower, Sisal',               category:'cat', stage:'all',        price:34.90, oldPrice:null,  rating:4.7, reviews:61,  tag:'new',  isNew:true },
  { id:13, name:'Cozy Enclosed Cat Cave Bed',                 category:'cat', stage:'senior-cat',  price:22.00, oldPrice:null,  rating:4.5, reviews:39,  tag:null,   isNew:false },
  { id:14, name:'Kitten Starter Wet Food, Chicken 12-pack',   category:'cat', stage:'kitten',     price:12.90, oldPrice:null,  rating:4.6, reviews:29,  tag:null,   isNew:true },
  { id:15, name:'Renal-Support Senior Cat Formula 3kg',       category:'cat', stage:'senior-cat',  price:26.40, oldPrice:null,  rating:4.5, reviews:22,  tag:null,   isNew:false },
  { id:16, name:'Tropical Seed & Grain Mix 1kg',              category:'bird', stage:'all',       price:5.60,  oldPrice:null,  rating:4.4, reviews:27,  tag:null,   isNew:false },
  { id:17, name:'Natural Wood Perch & Swing Set',             category:'bird', stage:'all',       price:12.90, oldPrice:15.90, rating:4.6, reviews:18,  tag:'sale', isNew:false },
  { id:18, name:'Freeze-Dried Aquarium Flake Food 200g',      category:'fish', stage:'all',        price:4.20,  oldPrice:null,  rating:4.3, reviews:35,  tag:null,   isNew:false },
  { id:19, name:'Full-Spectrum LED Aquarium Light Bar',       category:'fish', stage:'all',        price:24.50, oldPrice:null,  rating:4.5, reviews:22,  tag:'new',  isNew:true },
  { id:20, name:'Compressed Timothy Hay 2kg',                 category:'rodent', stage:'all',      price:7.10,  oldPrice:null,  rating:4.7, reviews:41,  tag:'top',  isNew:false },
  { id:21, name:'Silent-Spin Exercise Wheel',                 category:'rodent', stage:'all',      price:9.80,  oldPrice:11.50, rating:4.4, reviews:29,  tag:'sale', isNew:false },
];

/* ---------- SERVICES (Pet Express–style: vet, grooming, microchip, insurance) ---------- */
const SERVICES = [
  { id:'vet',        name:'Veterinary Care',   blurb:'Consults, vaccinations and check-ups with licensed vets.', img:'https://loremflickr.com/460/560/veterinarian,cat?lock=61', bookable:true },
  { id:'grooming',   name:'Professional Grooming', blurb:'Bath, cut and styling — tailored to breed and coat.',   img:'https://loremflickr.com/460/560/doggrooming?lock=62', bookable:true },
  { id:'microchip',  name:'Microchipping & ID', blurb:'Permanent identification in a single short visit.',       img:'https://loremflickr.com/460/560/veterinarian,dog?lock=63', bookable:true },
  { id:'insurance',  name:'Pet Insurance',      blurb:'Coverage for accidents, illness and surgery, from ₱495/yr.', img:'https://loremflickr.com/460/560/dog,vet?lock=64', bookable:false },
];

/* ---------- BRANDS (subset, Pet Express catalogue shape) ---------- */
const BRANDS = ['Royal Canin','Orijen','Acana','Purina Pro Plan','Pedigree','Whiskas','Frontline','Nexgard','Taste of the Wild','Zee.Dog','Bravecto','SmartHeart'];

/* ---------- VET-APPROVED GUIDES ---------- */
const GUIDES = [
  { id:1, tag:'Pet Parenting', title:'Carrier Size Guide: Choosing the Right Fit for Travel', img:'https://loremflickr.com/500/320/petcarrier,cat?lock=71' },
  { id:2, tag:'Nutrition & Feeding', title:'How to Choose Dog Food by Life Stage, Size and Needs', img:'https://loremflickr.com/500/320/dogfood?lock=72' },
  { id:3, tag:'Pet Parenting', title:'Retractable, Standard or Hands-Free: Picking a Leash', img:'https://loremflickr.com/500/320/dog,leash?lock=73' },
];

/* ---------- CATEGORY PAGE METADATA (each nav tab is its own page) ---------- */
const CATEGORY_INFO = {
  dog: {
    label:'Dogs', eyebrow:'For dogs of every age',
    desc:"Food, treats, gear and grooming — chosen the way you'd choose them for family.",
    img:'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1200&q=85',
    stages:[{value:'all',label:'All Dogs'},{value:'puppy',label:'Puppy'},{value:'adult-dog',label:'Adult'},{value:'senior-dog',label:'Senior'}],
  },
  cat: {
    label:'Cats', eyebrow:'For cats of every age',
    desc:'Nutrition, litter, enrichment and comfort, considered from whisker to tail.',
    img:'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=85',
    stages:[{value:'all',label:'All Cats'},{value:'kitten',label:'Kitten'},{value:'adult-cat',label:'Adult'},{value:'senior-cat',label:'Senior'}],
  },
  bird: {
    label:'Birds', eyebrow:'For feathered companions',
    desc:'Seed, perches and enrichment for a happy, healthy aviary.',
    img:'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=85',
    stages:[],
  },
  fish: {
    label:'Fish', eyebrow:'For aquatic life',
    desc:'Food, filtration and lighting to keep any tank thriving.',
    img:'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=85',
    stages:[],
  },
  rodent: {
    label:'Small Pets', eyebrow:'For small companions',
    desc:'Bedding, hay and enrichment for hamsters, rabbits and more.',
    img:'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=1200&q=85',
    stages:[],
  },
};

/* ---------- PET SHOPS / BRANCHES SAMPLE DATA ---------- */
const FALLBACK_CENTER = { lat:14.6760, lng:121.0437 };

const PET_SHOPS = [
  { id:1, name:'FurCare Poblacion (Sample)', type:'petshop', rating:4.6, openUntil:'8:00 PM', phone:'+63 917 000 1001', website:'furcare.ph/poblacion', address:'12 Sample Street, Demo District', dLat:0.006, dLng:0.004, mapPos:{x:42,y:56} },
  { id:2, name:'FurCare Veterinary Clinic — Northgate (Demo)', type:'vet', rating:4.8, openUntil:'6:00 PM', phone:'+63 917 000 1002', website:'furcare.ph/northgate-vet', address:'45 Placeholder Ave, Demo District', dLat:-0.018, dLng:0.022, mapPos:{x:70,y:26} },
  { id:3, name:'FurCare Grooming Studio (Sample)', type:'grooming', rating:4.5, openUntil:'7:00 PM', phone:'+63 917 000 1003', website:'furcare.ph/grooming', address:'8 Demo Lane, Sample Ville', dLat:0.024, dLng:-0.012, mapPos:{x:24,y:70} },
  { id:4, name:'FurCare Boarding Lodge (Demo)', type:'boarding', rating:4.4, openUntil:'Open 24 hours', phone:'+63 917 000 1004', website:'furcare.ph/boarding', address:'101 Fictional Rd, Demo District', dLat:-0.03, dLng:-0.03, mapPos:{x:16,y:18} },
  { id:5, name:'FurCare Supplies Co. (Sample)', type:'supplies', rating:4.3, openUntil:'9:00 PM', phone:'+63 917 000 1005', website:'furcare.ph/supplies', address:'77 Sample Blvd, Demo City', dLat:0.05, dLng:0.045, mapPos:{x:82,y:78} },
  { id:6, name:'FurCare Dog Daycare (Demo)', type:'dogcare', rating:4.7, openUntil:'6:30 PM', phone:'+63 917 000 1006', website:'furcare.ph/daycare', address:'3 Placeholder Ct, Sample Ville', dLat:0.003, dLng:-0.006, mapPos:{x:34,y:40} },
  { id:7, name:'FurCare Cat Lounge (Sample)', type:'catcare', rating:4.6, openUntil:'7:30 PM', phone:'+63 917 000 1007', website:'furcare.ph/catlounge', address:'19 Demo Terrace, Sample Ville', dLat:-0.05, dLng:0.012, mapPos:{x:60,y:12} },
  { id:8, name:'FurCare Pharmacy Essentials (Demo)', type:'supplies', rating:4.2, openUntil:'8:30 PM', phone:'+63 917 000 1008', website:'furcare.ph/pharmacy', address:'150 Fictional Ave, Demo City', dLat:0.14, dLng:-0.09, mapPos:{x:88,y:14} },
];

const TYPE_LABEL = {
  petshop:'Pet Shop', vet:'Veterinary Clinic', grooming:'Grooming',
  boarding:'Pet Boarding', supplies:'Pet Supplies', dogcare:'Dog Services', catcare:'Cat Services'
};

/* ---------- STATE ---------- */
const state = {
  products: [],
  backendReady: false,
  user: null,
  loyaltyPoints: 0,
  cart: [],
  wishlist: new Set(),
  productCat: 'all',
  productStage: 'all',
  productSearch: '',
  currentCategory: null,
  catStage: 'all',
  shopType: 'all',
  shopSearch: '',
  radiusKm: 10,
  userCoord: null,
  activeShopId: null,
  mobileView: 'map',
  activeService: null,
};

/* ---------- API HELPER ---------- */
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (parseErr) {
    // The server didn't return clean JSON -- usually a PHP warning/notice
    // (or a fatal error) got printed before the real JSON body, which
    // silently broke things before (treated as "signed out" with no
    // explanation). Surface it instead of hiding it.
    console.error(`[PawCare] ${path} did not return valid JSON:`, raw);
    throw new Error(`Server error calling ${path} (see console for details).`);
  }
  if (!res.ok) throw new Error(data.error || `Something went wrong (HTTP ${res.status}).`);
  return data;
}

function money(n){ return '₱' + Number(n).toFixed(2); }

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=> t.classList.remove('show'), 2400);
}

function escapeSvgText(str){
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Black "no image yet" placeholder — prints the product's ID, name and
   category directly on the box so it's obvious which row in the
   `products` table (image_url column) needs a real image link. */
function productPlaceholder(p){
  const id = (p && p.id != null) ? p.id : '?';
  const rawName = (p && p.name) ? String(p.name) : 'Unknown product';
  const name = rawName.length > 32 ? rawName.slice(0, 30) + '…' : rawName;
  const cat = (p && p.category) ? String(p.category).toUpperCase() : '';
  const idLabel = escapeSvgText('PRODUCT #' + id);
  const nameLabel = escapeSvgText(name);
  const catLabel = escapeSvgText(cat);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">'
    + '<rect width="800" height="800" fill="#05080d"/>'
    + '<rect x="120" y="120" width="560" height="560" rx="36" fill="#0b111a"/>'
    + '<path d="M245 470h310" stroke="#1c2b40" stroke-width="6" stroke-linecap="round"/>'
    + '<text x="400" y="330" text-anchor="middle" fill="#5c7291" font-family="Arial" font-size="20" letter-spacing="5">PAWCARE — NO IMAGE YET</text>'
    + '<text x="400" y="400" text-anchor="middle" fill="#4d9cff" font-family="Arial" font-size="30" font-weight="bold" letter-spacing="1">' + idLabel + '</text>'
    + '<text x="400" y="440" text-anchor="middle" fill="#c3d3ea" font-family="Arial" font-size="18">' + nameLabel + '</text>'
    + (catLabel ? '<text x="400" y="466" text-anchor="middle" fill="#6c84a3" font-family="Arial" font-size="12" letter-spacing="2">' + catLabel + '</text>' : '')
    + '<text x="400" y="540" text-anchor="middle" fill="#3d5573" font-family="Arial" font-size="12" letter-spacing="1">Set image_url for this product in the database</text>'
    + '</svg>';
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
function productImg(p){ return (p && p.image_url) ? p.image_url : productPlaceholder(p); }

/* ================= BOOTSTRAP ================= */
async function bootstrap(){
  const earlyGrid = document.getElementById('productGrid');
  if (earlyGrid) earlyGrid.innerHTML = skeletonCards(8);
  try {
    const sessionData = await api('api/session.php');
    state.user = sessionData.user;
    state.backendReady = true;
  } catch {
    state.backendReady = false;
  }

  if (state.backendReady) {
    try {
      const productsData = await api('api/products.php');
      state.products = productsData;
    } catch { state.products = FALLBACK_PRODUCTS; }
    try {
      const cartData = await api('api/cart.php');
      state.cart = cartData.items.map(i => ({ ...i }));
    } catch { state.cart = []; }
  } else {
    state.products = FALLBACK_PRODUCTS;
    state.cart = [];
    toast('Running in demo mode — start a PHP server to enable accounts & checkout.');
  }

  renderAccountMenu();
  renderNewArrivals();
  renderProducts();
  renderCart();
  renderServices();
  renderBrands();
  renderGuides();
  populateBookingBranches();
  showView('home');

  // Respect the URL hash on load (e.g. arriving at index.html#cart or
  // index.html#account from a category page's basket/account icon).
  // Previously showView('home') above always won, so clicking the
  // basket from Dogs.html/Cats.html/etc just landed you on the
  // homepage with no sign of your cart.
  openFromHash();
}

function openFromHash(){
  const hash = location.hash.replace('#', '');
  if (hash === 'cart') {
    openCart();
  } else if (hash === 'account') {
    if (state.user) {
      document.getElementById('accountMenu').hidden = false;
    } else {
      openAuth('signin');
    }
  }
}

/* ================= VIEW SWITCHING (each tab is its own separate page) ================= */
const VIEW_IDS = { home:'shopView', category:'categoryView', services:'servicesView', shops:'shopsView' };

function showView(view, opts = {}){
  Object.entries(VIEW_IDS).forEach(([key, id])=>{
    document.getElementById(id).hidden = key !== view;
  });

  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));

  if (view === 'home') {
    const link = document.querySelector('.nav-link[data-cat="all"]');
    if (link) link.classList.add('active');
  } else if (view === 'category') {
    const link = document.querySelector(`.nav-link[data-cat="${opts.cat}"]`);
    if (link) link.classList.add('active');
    renderCategoryView(opts.cat, opts.stage || 'all');
  } else if (view === 'services') {
    document.getElementById('servicesNavLink').classList.add('active');
    renderServicesFull();
  } else if (view === 'shops') {
    document.getElementById('navShopsLink').classList.add('active');
    renderShops();
  }

  document.getElementById('mainNav').classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ================= ACCOUNT / AUTH ================= */
function renderAccountMenu(){
  const signedOut = document.getElementById('accountSignedOut');
  const signedIn  = document.getElementById('accountSignedIn');
  if (state.user) {
    signedOut.hidden = true;
    signedIn.hidden = false;
    const firstName = state.user.name.split(' ')[0];
    document.getElementById('accountName').textContent = firstName;
    const helloEl = document.getElementById('accountHello');
    if (helloEl) helloEl.textContent = `Hello, ${firstName}!`;
    const greetingEl = document.getElementById('accountGreeting');
    if (greetingEl) { greetingEl.hidden = false; greetingEl.textContent = `Hello, ${firstName}`; }
    document.getElementById('loyaltyPoints').textContent = state.loyaltyPoints;
  } else {
    signedOut.hidden = false;
    signedIn.hidden = true;
    const greetingEl = document.getElementById('accountGreeting');
    if (greetingEl) greetingEl.hidden = true;
  }
}

function openAuth(tab){
  document.getElementById('authOverlay').classList.add('open');
  setAuthTab(tab);
}
function closeAuth(){ document.getElementById('authOverlay').classList.remove('open'); }

function setAuthTab(tab){
  document.querySelectorAll('.auth-tab').forEach(t=> t.classList.toggle('active', t.dataset.tab===tab));
  document.getElementById('signinForm').hidden = tab !== 'signin';
  document.getElementById('signupForm').hidden = tab !== 'signup';
}

async function handleSignin(e){
  e.preventDefault();
  const form = e.target;
  const errEl = document.getElementById('signinError');
  errEl.hidden = true;
  if (!state.backendReady) { errEl.textContent = 'Start the PHP server to enable sign in.'; errEl.hidden = false; return; }
  try {
    const { user } = await api('api/login.php', { method:'POST', body: JSON.stringify({
      email: form.email.value, password: form.password.value,
    })});
    state.user = user;
    state.loyaltyPoints = state.loyaltyPoints || 120;
    closeAuth();
    renderAccountMenu();
    toast(`Welcome back, ${user.name.split(' ')[0]}.`);
    const cartData = await api('api/cart.php');
    state.cart = cartData.items;
    renderCart();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  }
}

async function handleSignup(e){
  e.preventDefault();
  const form = e.target;
  const errEl = document.getElementById('signupError');
  errEl.hidden = true;
  if (!state.backendReady) { errEl.textContent = 'Start the PHP server to enable account creation.'; errEl.hidden = false; return; }
  try {
    const { user } = await api('api/register.php', { method:'POST', body: JSON.stringify({
      name: form.name.value, email: form.email.value, password: form.password.value,
    })});
    state.user = user;
    state.loyaltyPoints = 50;
    closeAuth();
    renderAccountMenu();
    toast(`Account created — welcome, ${user.name.split(' ')[0]}.`);
    const cartData = await api('api/cart.php');
    state.cart = cartData.items;
    renderCart();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  }
}

async function handleLogout(){
  if (state.backendReady) { try { await api('api/logout.php', { method:'POST' }); } catch {} }
  state.user = null;
  state.cart = [];
  renderAccountMenu();
  renderCart();
  toast('Signed out.');
}

/* ================= PRODUCTS RENDERING (Home) ================= */
function matchesFilters(p, term){
  const matchCat = state.productCat === 'all' || p.category === state.productCat;
  const matchStage = state.productStage === 'all' || p.stage === 'all' || p.stage === state.productStage;
  const matchSearch = !term || p.name.toLowerCase().includes(term);
  return matchCat && matchStage && matchSearch;
}

function productCardHTML(p){
  const badge = p.tag === 'sale' ? '<span class="product-badge badge-sale">Sale</span>'
              : p.tag === 'top' ? '<span class="product-badge badge-top">Top Pick</span>'
              : p.tag === 'new' ? '<span class="product-badge badge-new">New</span>' : '';
  const wished = state.wishlist.has(p.id);
  return `
    <div class="product-card">
      <div class="product-thumb" data-open="${p.id}">
        ${badge}
        <button class="wish-toggle ${wished?'active':''}" data-wish="${p.id}" aria-label="Toggle wishlist">${wished?'♥':'♡'}</button>
        <img src="${productImg(p)}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-body">
        <p class="product-name" data-open="${p.id}">${p.name}</p>
        <div class="product-rating">★ ${p.rating} · ${p.reviews} reviews</div>
        <div class="product-price-row">
          <span class="price-now">${money(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${money(p.oldPrice)}</span>` : ''}
        </div>
        <button class="add-cart-btn" data-add="${p.id}">Add to cart</button>
      </div>
    </div>`;
}

function renderProducts(){
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('emptyState');
  const term = state.productSearch.trim().toLowerCase();
  const filtered = state.products.filter(p=> matchesFilters(p, term));
  grid.innerHTML = filtered.map(productCardHTML).join('');
  empty.hidden = filtered.length !== 0;
}

function renderNewArrivals(){
  const grid = document.getElementById('newArrivalsGrid');
  const items = state.products.filter(p=>p.isNew).slice(0,6);
  grid.innerHTML = items.map(productCardHTML).join('');
}

function openProductModal(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalCard').innerHTML = `
    <button class="modal-close" id="modalClose">✕</button>
    <div class="detail-thumb"><img src="${productImg(p)}" alt="${p.name}"></div>
    <div class="modal-pad">
      <h2 style="margin:0 0 6px;">${p.name}</h2>
      <div class="product-rating" style="margin-bottom:10px;">★ ${p.rating} · ${p.reviews} reviews · ${p.category}</div>
      <div class="product-price-row" style="margin-bottom:16px;">
        <span class="price-now" style="font-size:1.4rem;">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${money(p.oldPrice)}</span>` : ''}
      </div>
      <p style="color:var(--fc-muted); font-size:0.9rem; line-height:1.6;">An everyday essential, chosen by fellow pet parents and reviewed for quality. Add it to your cart to keep your ${p.category === 'dog' ? 'dog' : p.category === 'cat' ? 'cat' : 'pet'} well cared for.</p>
      <button class="btn-primary btn-full" id="modalAddBtn">Add to cart — ${money(p.price)}</button>
    </div>
  `;
  overlay.classList.add('open');
  document.getElementById('modalClose').onclick = ()=> overlay.classList.remove('open');
  document.getElementById('modalAddBtn').onclick = ()=>{ addToCart(id); overlay.classList.remove('open'); };
}

/* ================= CATEGORY PAGE RENDERING (Dogs / Cats / Birds / Fish / Small Pets) ================= */
function renderCategoryView(cat, stage){
  const info = CATEGORY_INFO[cat];
  if (!info) return;
  state.currentCategory = cat;
  state.catStage = stage || 'all';

  document.getElementById('catEyebrow').textContent = info.eyebrow;
  document.getElementById('catTitle').textContent = info.label;
  document.getElementById('catDesc').textContent = info.desc;
  document.getElementById('catHeroImg').src = info.img;
  document.getElementById('catHeroImg').alt = info.label;
  document.getElementById('catBreadcrumbLabel').textContent = info.label;
  document.getElementById('catProductsTitle').textContent = `${info.label} essentials`;

  const stageSection = document.getElementById('catLifeStageSection');
  const stageRow = document.getElementById('catLifeStageRow');
  if (info.stages.length) {
    stageSection.hidden = false;
    stageRow.innerHTML = info.stages.map(s=>
      `<button class="life-chip ${s.value===state.catStage?'active':''}" data-stage="${s.value}">${s.label}</button>`
    ).join('');
  } else {
    stageSection.hidden = true;
  }

  renderCategoryProducts();

  document.getElementById('catServicesGrid').innerHTML = SERVICES.filter(s=>s.bookable).map(serviceCardHTML).join('');
}

function renderCategoryProducts(){
  const cat = state.currentCategory;
  if (!cat) return;
  const term = state.productSearch.trim().toLowerCase();
  const filtered = state.products.filter(p=>{
    const matchCat = p.category === cat;
    const matchStage = state.catStage === 'all' || p.stage === 'all' || p.stage === state.catStage;
    const matchSearch = !term || p.name.toLowerCase().includes(term);
    return matchCat && matchStage && matchSearch;
  });
  const grid = document.getElementById('catProductGrid');
  const empty = document.getElementById('catEmptyState');
  grid.innerHTML = filtered.map(productCardHTML).join('');
  empty.hidden = filtered.length !== 0;
  document.getElementById('catProductsEyebrow').textContent = `${filtered.length} item${filtered.length===1?'':'s'}`;
}

/* ================= WISHLIST ================= */
function toggleWishlist(id){
  if(state.wishlist.has(id)) state.wishlist.delete(id);
  else state.wishlist.add(id);
  document.getElementById('wishlistBadge').textContent = state.wishlist.size;
  renderProducts();
  renderNewArrivals();
  if (state.currentCategory && !document.getElementById('categoryView').hidden) renderCategoryProducts();
}

/* ================= CART ================= */
async function addToCart(id){
  if (state.backendReady) {
    try {
      const { items } = await api('api/cart.php', { method:'POST', body: JSON.stringify({ product_id:id, delta:1 }) });
      state.cart = items;
      renderCart();
      toast('Added to cart.');
      return;
    } catch (err) { toast(err.message); return; }
  }
  const p = state.products.find(x=>x.id===id);
  const existing = state.cart.find(c=>c.product_id===id);
  if (existing) existing.qty += 1;
  else state.cart.push({ product_id:id, qty:1, name:p.name, price:p.price, img:productImg(p), category:p.category });
  renderCart();
  toast('Added to cart.');
}

async function changeQty(id, delta){
  if (state.backendReady) {
    try {
      const { items } = await api('api/cart.php', { method:'POST', body: JSON.stringify({ product_id:id, delta }) });
      state.cart = items;
      renderCart();
      return;
    } catch (err) { toast(err.message); return; }
  }
  const item = state.cart.find(c=>c.product_id===id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(c=>c.product_id!==id);
  renderCart();
}

async function removeFromCart(id){
  if (state.backendReady) {
    try {
      const { items } = await api('api/cart.php', { method:'DELETE', body: JSON.stringify({ product_id:id }) });
      state.cart = items;
      renderCart();
      return;
    } catch (err) { toast(err.message); return; }
  }
  state.cart = state.cart.filter(c=>c.product_id!==id);
  renderCart();
}

function cartSubtotal(){
  return state.cart.reduce((s,c)=> s + Number(c.price) * c.qty, 0);
}

function renderCart(){
  const wrap = document.getElementById('cartItems');
  const emptyMsg = document.getElementById('cartEmpty');
  const count = state.cart.reduce((s,c)=>s+c.qty,0);
  document.getElementById('cartBadge').textContent = count;
  emptyMsg.hidden = state.cart.length !== 0;
  wrap.innerHTML = state.cart.map(c=>`
    <div class="cart-item">
      <div class="cart-item__thumb"><img src="${c.img || `https://loremflickr.com/120/120/pet?lock=${c.product_id}`}" alt="${c.name}"></div>
      <div class="cart-item__info">
        <p>${c.name}</p>
        <span>${money(c.price)} each</span>
        <div class="qty-control">
          <button data-qty="${c.product_id}" data-delta="-1">−</button>
          <span>${c.qty}</span>
          <button data-qty="${c.product_id}" data-delta="1">+</button>
        </div>
        <div class="remove-item" data-remove="${c.product_id}">Remove</div>
      </div>
    </div>
  `).join('');
  document.getElementById('cartSubtotal').textContent = money(cartSubtotal());
}
function openCart(){
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}
function closeCart(){
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

/* ================= CHECKOUT ================= */
function openCheckout(){
  if (state.cart.length === 0) { toast('Your cart is empty.'); return; }
  if (!state.backendReady) { toast('Start the PHP server to enable checkout.'); return; }
  if (!state.user) {
    closeCart();
    openAuth('signin');
    toast('Please sign in to check out.');
    return;
  }
  const subtotal = cartSubtotal();
  const shipping = subtotal >= 50 ? 0 : 4.99;
  document.getElementById('checkoutSummary').innerHTML = `
    <div class="checkout-summary__row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <div class="checkout-summary__row"><span>Shipping</span><span>${shipping===0?'Free':money(shipping)}</span></div>
    <div class="checkout-summary__row total"><span>Total</span><span>${money(subtotal+shipping)}</span></div>
  `;
  document.getElementById('checkoutError').hidden = true;
  closeCart();
  document.getElementById('checkoutOverlay').classList.add('open');
}
function closeCheckout(){ document.getElementById('checkoutOverlay').classList.remove('open'); }

async function handleCheckout(e){
  e.preventDefault();
  const form = e.target;
  const errEl = document.getElementById('checkoutError');
  const btn = document.getElementById('placeOrderBtn');
  errEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Placing order…';

  try {
    const payload = {
      full_name: form.full_name.value,
      phone: form.phone.value,
      line1: form.line1.value,
      city: form.city.value,
      province: form.province.value,
      postal_code: form.postal_code.value,
      payment_method: form.payment_method.value,
      fulfillment: form.fulfillment.value,
    };
    const result = await api('api/checkout.php', { method:'POST', body: JSON.stringify(payload) });
    state.cart = [];
    state.loyaltyPoints += Math.round(cartSubtotal());
    renderCart();
    renderAccountMenu();
    if (result.checkout_url) {
      window.location.href = result.checkout_url;
    } else if (result.redirect) {
      window.location.href = result.redirect;
    } else {
      closeCheckout();
      toast(result.error || 'Order placed.');
    }
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Place order';
  }
}

/* ================= SERVICES + BOOKING ================= */
function serviceCardHTML(s){
  return `
    <div class="service-card" data-service="${s.id}">
      <img src="${s.img}" alt="${s.name}">
      <div class="service-card__body">
        <h3>${s.name}</h3>
        <p>${s.blurb}</p>
        <span class="service-card__cta">${s.bookable ? 'Book now →' : 'Learn more →'}</span>
      </div>
    </div>
  `;
}

function renderServices(){
  document.getElementById('servicesGrid').innerHTML = SERVICES.map(serviceCardHTML).join('');
}

function renderServicesFull(){
  const grid = document.getElementById('servicesGridFull');
  if (grid) grid.innerHTML = SERVICES.map(serviceCardHTML).join('');
}

function populateBookingBranches(){
  const sel = document.getElementById('bookingBranch');
  const bookable = PET_SHOPS.filter(s=> ['vet','grooming','petshop'].includes(s.type));
  sel.innerHTML = bookable.map(s=> `<option value="${s.id}">${s.name}</option>`).join('');
}

function openBooking(serviceId){
  const svc = SERVICES.find(s=>s.id===serviceId);
  if(!svc){
    // insurance (not bookable) -> route to learn-more instead
    openInsuranceInfo();
    return;
  }
  state.activeService = serviceId;
  document.getElementById('bookingTitle').textContent = `Book: ${svc.name}`;
  document.getElementById('bookingSub').textContent = 'Pick a branch, date and time — we\'ll confirm by email.';
  document.getElementById('bookingOverlay').classList.add('open');
}
function closeBooking(){ document.getElementById('bookingOverlay').classList.remove('open'); }

function handleBooking(e){
  e.preventDefault();
  const form = e.target;
  const branchName = document.getElementById('bookingBranch').selectedOptions[0]?.textContent || 'your chosen branch';
  toast(`Appointment requested for ${form.pet_name.value} at ${branchName} — we'll confirm by email.`);
  closeBooking();
  form.reset();
}

function openInsuranceInfo(){
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalCard').innerHTML = `
    <button class="modal-close" id="modalClose">✕</button>
    <div class="detail-thumb"><img src="https://loremflickr.com/700/440/dog,vet?lock=91" alt="Pet insurance"></div>
    <div class="modal-pad">
      <h2 style="margin:0 0 8px;">FurCare Assurance</h2>
      <p style="color:var(--fc-muted); font-size:0.92rem; line-height:1.65; margin:0 0 14px;">Accidents and illness rarely wait for a good time. FurCare Assurance covers vet consultations, surgery, hospitalization and emergency care for dogs and cats, with plans starting at ₱495 a year.</p>
      <p class="demo-tag">Demo content — connect an insurance partner API to enable real quotes.</p>
      <button class="btn-primary btn-full" id="modalCloseInsurance" style="margin-top:14px;">Got it</button>
    </div>
  `;
  overlay.classList.add('open');
  document.getElementById('modalClose').onclick = ()=> overlay.classList.remove('open');
  document.getElementById('modalCloseInsurance').onclick = ()=> overlay.classList.remove('open');
}

/* ================= BRANDS ================= */
function renderBrands(){
  document.getElementById('brandRow').innerHTML = BRANDS.map(b=>`<button class="brand-chip" data-brand="${b}">${b}</button>`).join('');
}

/* ================= GUIDES ================= */
function renderGuides(){
  document.getElementById('guidesGrid').innerHTML = GUIDES.map(g=>`
    <div class="guide-card" data-guide="${g.id}">
      <div class="guide-card__thumb"><img src="${g.img}" alt="${g.title}"></div>
      <div class="guide-card__body">
        <span class="guide-tag">${g.tag}</span>
        <h3>${g.title}</h3>
        <span>Published by FurCare</span>
      </div>
    </div>
  `).join('');
}

function openGuide(id){
  const g = GUIDES.find(x=>x.id===id);
  if(!g) return;
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalCard').innerHTML = `
    <button class="modal-close" id="modalClose">✕</button>
    <div class="detail-thumb"><img src="${g.img}" alt="${g.title}"></div>
    <div class="modal-pad">
      <span class="guide-tag">${g.tag}</span>
      <h2 style="margin:8px 0 10px;">${g.title}</h2>
      <p style="color:var(--fc-muted); font-size:0.92rem; line-height:1.65;">This is a demo article placeholder. Connect a real content source (CMS, blog API, or markdown files) to populate FurCare's vet-approved guides with full articles.</p>
    </div>
  `;
  overlay.classList.add('open');
  document.getElementById('modalClose').onclick = ()=> overlay.classList.remove('open');
}

/* ================= PET SHOPS / STORES ================= */
function haversineKm(lat1,lng1,lat2,lng2){
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLng = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function shopDistanceKm(shop){
  const center = state.userCoord || FALLBACK_CENTER;
  const shopCoord = { lat: center.lat + shop.dLat, lng: center.lng + shop.dLng };
  return haversineKm(center.lat, center.lng, shopCoord.lat, shopCoord.lng);
}
function shopCoord(shop){
  const center = state.userCoord || FALLBACK_CENTER;
  return { lat: center.lat + shop.dLat, lng: center.lng + shop.dLng };
}

function filteredShops(){
  const term = state.shopSearch.trim().toLowerCase();
  return PET_SHOPS
    .map(s=> ({ ...s, distance: shopDistanceKm(s) }))
    .filter(s=>{
      const matchType = state.shopType === 'all' || s.type === state.shopType;
      const matchSearch = !term || s.name.toLowerCase().includes(term) || TYPE_LABEL[s.type].toLowerCase().includes(term);
      const matchRadius = s.distance <= state.radiusKm;
      return matchType && matchSearch && matchRadius;
    })
    .sort((a,b)=> a.distance - b.distance);
}

function renderShops(){
  const list = document.getElementById('shopsList');
  const emptyState = document.getElementById('shopsEmptyState');
  const results = filteredShops();
  document.getElementById('resultCount').textContent = `(${results.length} found)`;
  emptyState.hidden = results.length !== 0;
  list.innerHTML = '';

  results.forEach(s=>{
    const card = document.createElement('div');
    card.className = 'shop-card' + (state.activeShopId===s.id ? ' active' : '');
    card.dataset.shop = s.id;
    card.innerHTML = `
      <div class="shop-card__top">
        <div>
          <span class="shop-card__type">${TYPE_LABEL[s.type]}</span>
          <p class="shop-card__name">${s.name}</p>
        </div>
      </div>
      <div class="shop-card__meta">
        <span class="shop-card__rating">★ ${s.rating}</span>
        <span>${s.distance.toFixed(1)} km away</span>
        <span>Open until ${s.openUntil}</span>
      </div>
      <span class="demo-tag">Sample data for demo purposes</span>
      <div class="shop-card__actions">
        <button class="btn-directions" data-directions="${s.id}">Get Directions</button>
        <button class="btn-details" data-details="${s.id}">View Details</button>
      </div>
    `;
    card.addEventListener('click', (e)=>{
      if(e.target.closest('button')) return;
      selectShop(s.id, true);
    });
    list.appendChild(card);
  });

  renderMapMarkers(results);
}

function renderMapMarkers(results){
  const wrap = document.getElementById('fakeMapMarkers');
  wrap.innerHTML = '';
  const visibleIds = new Set(results.map(s=>s.id));
  PET_SHOPS.forEach(s=>{
    const isVisible = visibleIds.has(s.id);
    const marker = document.createElement('button');
    marker.className = 'map-marker' + (state.activeShopId===s.id?' active':'') + (isVisible? '' : ' dimmed');
    marker.style.left = s.mapPos.x + '%';
    marker.style.top = s.mapPos.y + '%';
    marker.title = s.name;
    marker.textContent = 'Location';
    marker.addEventListener('click', ()=> selectShop(s.id, false));
    wrap.appendChild(marker);
  });
}

function selectShop(id, scrollList){
  state.activeShopId = id;
  const s = PET_SHOPS.find(x=>x.id===id);
  if(!s) return;
  const distance = shopDistanceKm(s);

  document.querySelectorAll('.shop-card').forEach(c=> c.classList.toggle('active', Number(c.dataset.shop)===id));
  document.querySelectorAll('.map-marker').forEach((m,i)=> m.classList.toggle('active', PET_SHOPS[i].id===id));

  if(scrollList === false){
    const card = document.querySelector(`.shop-card[data-shop="${id}"]`);
    if(card) card.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  const popup = document.getElementById('markerPopup');
  popup.hidden = false;
  popup.innerHTML = `
    <h4>${s.name}</h4>
    <p>${TYPE_LABEL[s.type]} · ★ ${s.rating} rating</p>
    <p>${distance.toFixed(1)} km away · Open until ${s.openUntil}</p>
    <p>${s.phone} · ${s.website}</p>
    <div class="marker-popup__actions">
      <button class="btn-directions" data-directions="${s.id}">Get Directions</button>
      <button class="btn-details" data-details="${s.id}">View Details</button>
    </div>
  `;
}

function openShopDetails(id){
  const s = PET_SHOPS.find(x=>x.id===id);
  if(!s) return;
  const distance = shopDistanceKm(s);
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalCard').innerHTML = `
    <button class="modal-close" id="modalClose">✕</button>
    <div class="modal-pad">
      <span class="shop-card__type">${TYPE_LABEL[s.type]}</span>
      <h2 style="margin:8px 0 6px;">${s.name}</h2>
      <p style="color:var(--fc-muted); font-size:0.9rem;">★ ${s.rating} rating · ${distance.toFixed(1)} km away · Open until ${s.openUntil}</p>
      <p style="margin:14px 0 4px;"><strong>Address:</strong> ${s.address}</p>
      <p style="margin:4px 0;"><strong>Phone:</strong> ${s.phone}</p>
      <p style="margin:4px 0 16px;"><strong>Website:</strong> ${s.website}</p>
      <p class="demo-tag">Sample data shown for demonstration only — not a real business.</p>
      <button class="btn-primary btn-full" id="modalDirectionsBtn" style="margin-top:14px;">Get Directions →</button>
    </div>
  `;
  overlay.classList.add('open');
  document.getElementById('modalClose').onclick = ()=> overlay.classList.remove('open');
  document.getElementById('modalDirectionsBtn').onclick = ()=> openDirections(id);
}

function openDirections(id){
  const s = PET_SHOPS.find(x=>x.id===id);
  if(!s) return;
  const c = shopCoord(s);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
  window.open(url, '_blank', 'noopener');
}

function locateMe(){
  if(!navigator.geolocation){
    toast('Geolocation is not supported on this device.');
    return;
  }
  toast('Locating you…');
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      state.userCoord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      document.getElementById('youAreHere').innerHTML =
        `Using your location (~${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}). Distances below are estimated for this demo.`;
      renderShops();
      toast('Location found — distances updated.');
    },
    ()=>{
      toast('Could not access your location — showing demo distances instead.');
    },
    { enableHighAccuracy:false, timeout:8000 }
  );
}

/* ================= EVENTS ================= */
function attachInteractiveMotion() {
  document.querySelectorAll('.feature-card, .product-card, .hero-art').forEach(card => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - y) * 10;
      const ry = (x - 0.5) * 12;
      card.style.setProperty('--tilt-x', `${rx}deg`);
      card.style.setProperty('--tilt-y', `${ry}deg`);
      card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.transform = '';
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  /* --- CRITICAL: auth / checkout / logout wiring goes FIRST and is
     isolated in its own try/catch. Sign-in and checkout must keep
     working even if an unrelated feature further down this file
     throws an error (a missing element, etc). Previously all bindings
     lived in one unguarded block, so a single failure anywhere would
     silently cancel every listener after it -- including these -- and
     the sign-in form would fall back to a native browser submission
     (which is why email/password could show up in the URL bar). */
  try {
    document.getElementById('accountBtn').addEventListener('click', ()=>{
      document.getElementById('accountMenu').hidden = !document.getElementById('accountMenu').hidden;
    });
    document.addEventListener('click', (e)=>{
      if (!document.getElementById('accountWrap').contains(e.target)) {
        document.getElementById('accountMenu').hidden = true;
      }
    });
    document.getElementById('openSignIn').addEventListener('click', ()=> openAuth('signin'));
    document.getElementById('openSignUp').addEventListener('click', ()=> openAuth('signup'));
    document.getElementById('authClose').addEventListener('click', closeAuth);
    document.querySelectorAll('.auth-tab').forEach(tab=> tab.addEventListener('click', ()=> setAuthTab(tab.dataset.tab)));
    document.getElementById('signinForm').addEventListener('submit', handleSignin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
    document.getElementById('authOverlay').addEventListener('click', (e)=>{
      if(e.target.id === 'authOverlay') closeAuth();
    });
    document.getElementById('checkoutOverlay').addEventListener('click', (e)=>{
      if(e.target.id === 'checkoutOverlay') closeCheckout();
    });
  } catch (err) {
    console.error('[PawCare] Auth/checkout wiring failed to attach:', err);
  }

  attachInteractiveMotion();
  bootstrap();

  /* --- nav: each tab opens its own separate page --- */
  document.querySelectorAll('.nav-link[data-cat]').forEach(link=>{
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      const cat = link.dataset.cat;
      if (cat === 'all') showView('home');
      else showView('category', { cat, stage:'all' });
    });
  });
  document.querySelector('.logo[data-view="home"]').addEventListener('click', (e)=>{ e.preventDefault(); showView('home'); });
  document.getElementById('navShopsLink').addEventListener('click', (e)=>{ e.preventDefault(); showView('shops'); });
  document.getElementById('servicesNavLink').addEventListener('click', (e)=>{ e.preventDefault(); showView('services'); });
  document.getElementById('promoShopsBtn').addEventListener('click', ()=> showView('shops'));
  document.getElementById('shopNowBtn').addEventListener('click', ()=>{
    showView('home');
    setTimeout(()=> document.querySelector('#shopView .products-section')?.scrollIntoView({behavior:'smooth'}), 60);
  });
  document.getElementById('heroServicesBtn').addEventListener('click', ()=> showView('services'));
  document.getElementById('homeSeeAllServicesBtn').addEventListener('click', ()=> showView('services'));
  document.getElementById('catBackHome').addEventListener('click', (e)=>{ e.preventDefault(); showView('home'); });
  document.getElementById('hamburgerBtn').addEventListener('click', ()=> document.getElementById('mainNav').classList.toggle('open'));

  /* --- pet tiles (shop by companion) -> open that category's own page --- */
  document.getElementById('petTiles').addEventListener('click', (e)=>{
    const btn = e.target.closest('.pet-tile');
    if(!btn) return;
    showView('category', { cat: btn.dataset.cat, stage:'all' });
  });

  /* --- home life stage chips (filters the Home popular grid only) --- */
  document.getElementById('lifeStageRow').addEventListener('click', (e)=>{
    const btn = e.target.closest('.life-chip');
    if(!btn) return;
    state.productStage = btn.dataset.stage;
    document.querySelectorAll('#lifeStageRow .life-chip').forEach(c=> c.classList.toggle('active', c===btn));
    renderProducts();
  });

  /* --- category page life stage chips --- */
  document.getElementById('catLifeStageRow').addEventListener('click', (e)=>{
    const btn = e.target.closest('.life-chip');
    if(!btn) return;
    state.catStage = btn.dataset.stage;
    document.querySelectorAll('#catLifeStageRow .life-chip').forEach(c=> c.classList.toggle('active', c===btn));
    renderCategoryProducts();
  });

  /* --- home product filter pills --- */
  document.getElementById('filterPills').addEventListener('click', (e)=>{
    const btn = e.target.closest('.pill');
    if(!btn) return;
    state.productCat = btn.dataset.cat;
    document.querySelectorAll('#filterPills .pill').forEach(p=>p.classList.toggle('active', p===btn));
    renderProducts();
  });

  /* --- header search: filters whichever product grid is currently visible --- */
  document.getElementById('productSearch').addEventListener('input', (e)=>{
    state.productSearch = e.target.value;
    if (!document.getElementById('categoryView').hidden) renderCategoryProducts();
    else renderProducts();
  });

  /* --- product grid delegation (new arrivals + popular + category page) --- */
  function handleProductGridClick(e){
    const add = e.target.closest('[data-add]');
    const wish = e.target.closest('[data-wish]');
    const open = e.target.closest('[data-open]');
    if(add) addToCart(Number(add.dataset.add));
    else if(wish) toggleWishlist(Number(wish.dataset.wish));
    else if(open) openProductModal(Number(open.dataset.open));
  }
  document.getElementById('productGrid').addEventListener('click', handleProductGridClick);
  document.getElementById('newArrivalsGrid').addEventListener('click', handleProductGridClick);
  document.getElementById('catProductGrid').addEventListener('click', handleProductGridClick);

  /* --- services / booking (home teaser, category page, services page) --- */
  function handleServicesGridClick(e){
    const card = e.target.closest('.service-card');
    if(!card) return;
    openBooking(card.dataset.service);
  }
  document.getElementById('servicesGrid').addEventListener('click', handleServicesGridClick);
  document.getElementById('catServicesGrid').addEventListener('click', handleServicesGridClick);
  document.getElementById('servicesGridFull').addEventListener('click', handleServicesGridClick);

  document.getElementById('bookingClose').addEventListener('click', closeBooking);
  document.getElementById('bookingOverlay').addEventListener('click', (e)=>{ if(e.target.id==='bookingOverlay') closeBooking(); });
  document.getElementById('bookingForm').addEventListener('submit', handleBooking);
  document.getElementById('insuranceLearnBtn').addEventListener('click', openInsuranceInfo);
  document.getElementById('servicesInsuranceBtn').addEventListener('click', openInsuranceInfo);
  document.getElementById('footerVetLink').addEventListener('click', (e)=>{ e.preventDefault(); showView('services'); });
  document.getElementById('footerGroomLink').addEventListener('click', (e)=>{ e.preventDefault(); showView('services'); });
  document.getElementById('footerMicrochipLink').addEventListener('click', (e)=>{ e.preventDefault(); showView('services'); });
  document.getElementById('footerInsuranceLink').addEventListener('click', (e)=>{ e.preventDefault(); openInsuranceInfo(); });
  document.getElementById('footerBrandsLink').addEventListener('click', (e)=>{
    e.preventDefault();
    showView('home');
    setTimeout(()=> document.querySelector('.brand-strip')?.scrollIntoView({behavior:'smooth'}), 60);
  });
  document.getElementById('footerSaleLink').addEventListener('click', (e)=>{
    e.preventDefault();
    showView('home');
    setTimeout(()=> document.querySelector('#shopView .products-section')?.scrollIntoView({behavior:'smooth'}), 60);
  });

  /* --- footer "Dog essentials" / "Cat essentials" -> open that page --- */
  document.querySelectorAll('.footer-col a[data-cat]').forEach(link=>{
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      showView('category', { cat: link.dataset.cat, stage:'all' });
    });
  });

  /* --- brand strip --- */
  document.getElementById('brandRow').addEventListener('click', (e)=>{
    const btn = e.target.closest('.brand-chip');
    if(!btn) return;
    showView('home');
    document.getElementById('productSearch').value = btn.dataset.brand;
    state.productSearch = btn.dataset.brand;
    renderProducts();
    toast(`Showing items related to ${btn.dataset.brand} (demo — full catalogue not connected).`);
    setTimeout(()=> document.querySelector('#shopView .products-section')?.scrollIntoView({behavior:'smooth'}), 60);
  });

  /* --- guides --- */
  document.getElementById('guidesGrid').addEventListener('click', (e)=>{
    const card = e.target.closest('.guide-card');
    if(!card) return;
    openGuide(Number(card.dataset.guide));
  });

  /* --- newsletter --- */
  document.getElementById('newsletterForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    toast('Subscribed — thank you for staying close.');
    e.target.reset();
  });

  /* --- account menu / auth modal ---
     (signin/signup/logout/checkout bindings now happen earlier, in the
     guarded block near the top of this handler -- see comment there) */

  /* --- cart drawer --- */
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('closeCart').addEventListener('click', closeCart);
  document.getElementById('drawerOverlay').addEventListener('click', ()=>{ closeCart(); document.getElementById('modalOverlay').classList.remove('open'); });
  document.getElementById('cartItems').addEventListener('click', (e)=>{
    const qtyBtn = e.target.closest('[data-qty]');
    const removeBtn = e.target.closest('[data-remove]');
    if(qtyBtn) changeQty(Number(qtyBtn.dataset.qty), Number(qtyBtn.dataset.delta));
    else if(removeBtn) removeFromCart(Number(removeBtn.dataset.remove));
  });
  document.getElementById('wishlistBtn').addEventListener('click', ()=>{
    toast(state.wishlist.size ? `${state.wishlist.size} item(s) in your wishlist` : 'Your wishlist is empty');
  });

  /* --- modal overlay close on backdrop --- */
  document.getElementById('modalOverlay').addEventListener('click', (e)=>{
    if(e.target.id === 'modalOverlay') e.target.classList.remove('open');
  });

  /* --- pet shops: filters --- */
  document.getElementById('typeFilters').addEventListener('click', (e)=>{
    const btn = e.target.closest('.pill');
    if(!btn) return;
    state.shopType = btn.dataset.type;
    document.querySelectorAll('#typeFilters .pill').forEach(p=>p.classList.toggle('active', p===btn));
    renderShops();
  });
  document.getElementById('shopSearch').addEventListener('input', (e)=>{
    state.shopSearch = e.target.value;
    renderShops();
  });
  document.getElementById('radiusSelect').addEventListener('change', (e)=>{
    state.radiusKm = Number(e.target.value);
    renderShops();
  });
  document.getElementById('locateBtn').addEventListener('click', locateMe);
  document.getElementById('fakeMapLocate').addEventListener('click', locateMe);

  /* --- pet shops: list & map delegation --- */
  if (document.getElementById('shopsList')) {
  document.getElementById('shopsList').addEventListener('click', (e)=>{
    const dir = e.target.closest('[data-directions]');
    const det = e.target.closest('[data-details]');
    if(dir) openDirections(Number(dir.dataset.directions));
    else if(det) openShopDetails(Number(det.dataset.details));
  });
  document.getElementById('markerPopup').addEventListener('click', (e)=>{
    const dir = e.target.closest('[data-directions]');
    const det = e.target.closest('[data-details]');
    if(dir) openDirections(Number(dir.dataset.directions));
    else if(det) openShopDetails(Number(det.dataset.details));
  });

  /* --- fake map zoom (cosmetic) --- */
  let zoom = 1;
  document.getElementById('zoomIn').addEventListener('click', ()=>{
    zoom = Math.min(1.6, zoom + 0.2);
    document.getElementById('fakeMap').querySelector('.fake-map__grid').style.backgroundSize = `${44*zoom}px ${44*zoom}px`;
  });
  document.getElementById('zoomOut').addEventListener('click', ()=>{
    zoom = Math.max(0.6, zoom - 0.2);
    document.getElementById('fakeMap').querySelector('.fake-map__grid').style.backgroundSize = `${44*zoom}px ${44*zoom}px`;
  });

  /* --- mobile map/list toggle --- */
  document.getElementById('mobileViewToggle').addEventListener('click', (e)=>{
    const btn = e.target.closest('.toggle-btn');
    if(!btn) return;
    document.querySelectorAll('.toggle-btn').forEach(b=>b.classList.toggle('active', b===btn));
    const layout = document.querySelector('.shops-layout');
    layout.classList.remove('show-list-only','show-map-only');
    layout.classList.add(btn.dataset.view === 'list' ? 'show-list-only' : 'show-map-only');
  });
  }
});

// Standalone HTML page controls retained for the original site architecture.
window.toggleCart = window.toggleCart || function(){ sessionStorage.setItem('pawcareSkipHomeGalaxy','1'); location.href='index.html#cart'; };
window.toggleAuth = window.toggleAuth || function(){ location.href='index.html#account'; };


/* =========================================================
   3D TILT — product cards & hero art follow the cursor
   (desktop, fine-pointer only; respects reduced-motion)
   ========================================================= */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(reduceMotion || !finePointer) return;

  function tilt(el, e, maxDeg){
    var r = el.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width;
    var py = (e.clientY - r.top) / r.height;
    var rx = (0.5 - py) * maxDeg;
    var ry = (px - 0.5) * maxDeg;
    el.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
  }
  function reset(el){ el.style.transform = ''; }

  document.addEventListener('mousemove', function(e){
    var card = e.target.closest && e.target.closest('.product-card');
    if(card) tilt(card, e, 8);
  });
  document.addEventListener('mouseover', function(e){
    var card = e.target.closest && e.target.closest('.product-card');
    if(card) card.classList.add('is-tilting');
  });
  document.addEventListener('mouseout', function(e){
    var card = e.target.closest && e.target.closest('.product-card');
    if(card && (!e.relatedTarget || !card.contains(e.relatedTarget))){
      card.classList.remove('is-tilting');
      reset(card);
    }
  });

  var heroArt = document.querySelector('.hero-art');
  if(heroArt){
    heroArt.addEventListener('mousemove', function(e){ tilt(heroArt, e, 5); });
    heroArt.addEventListener('mouseleave', function(){ reset(heroArt); });
  }
})();


/* =========================================================
   SKELETON LOADING CARDS — shown briefly while a product
   fetch is in flight, instead of a blank/empty grid.
   ========================================================= */
function skeletonCards(count){
  var out = '';
  for(var i = 0; i < count; i++){
    out += '<div class="skeleton-card"><div class="skeleton-thumb"></div><div class="skeleton-body">'
      + '<div class="skeleton-line w-90"></div><div class="skeleton-line w-70"></div>'
      + '<div class="skeleton-line w-40"></div></div></div>';
  }
  return out;
}
window.skeletonCards = skeletonCards;
