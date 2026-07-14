import React, { useState } from "react";

// ============ SUPABASE CONNECTION ============
const SUPABASE_URL = "https://zccyfxrphmwnzucvlltj.supabase.co";
const SUPABASE_KEY = "sb_publishable_X6Qs0seyCwfOhkVjZScktQ_Go-iv2QH";

// نحول رقم الهاتف لإيميل داخلي وهمي (حيلة مجانية بدل SMS المدفوع)
function phoneToEmail(phone) {
  const clean = phone.replace(/\s+/g, "").replace(/^0/, "213");
  return `${clean}@souq-jumla.local`;
}

async function supabaseSignUp(email, password, metadata) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ email, password, data: metadata }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || "فشل إنشاء الحساب");
  return data;
}

async function supabaseSignIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "رقم الهاتف أو كلمة المرور غير صحيحة");
  return data;
}

async function supabaseGetProfile(userId, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error("تعذر جلب بيانات الحساب");
  return data[0] || null;
}

// جلب منتجات تاجر جملة معيّن
async function supabaseGetMyProducts(wholesalerId, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?wholesaler_id=eq.${wholesalerId}&select=*&order=created_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر جلب المنتجات");
  return res.json();
}

// جلب كل المنتجات مع السعر الخاص بتاجر تجزئة معيّن (إن وجد)
async function supabaseGetProductsForRetailer(retailerId, accessToken) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=*,custom_prices(price,retailer_id)&custom_prices.retailer_id=eq.${retailerId}&order=created_at.desc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("تعذر جلب المنتجات");
  return res.json();
}

async function supabaseInsertProduct(product, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(product),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("تعذر إضافة المنتج");
  return data[0];
}

async function supabaseUploadImage(file, path, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": file.type,
    },
    body: file,
  });
  if (!res.ok) throw new Error("تعذر رفع الصورة");
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

async function supabaseGetRetailers(accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?role=eq.retail&select=id,full_name,city,phone`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر جلب التجار");
  return res.json();
}

async function supabaseGetCustomPricesForProduct(productId, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/custom_prices?product_id=eq.${productId}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر جلب الأسعار");
  return res.json();
}

async function supabaseUpsertCustomPrice(productId, retailerId, price, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/custom_prices?on_conflict=product_id,retailer_id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({ product_id: productId, retailer_id: retailerId, price }),
  });
  if (!res.ok) throw new Error("تعذر حفظ السعر");
  return res.json();
}

async function supabaseDeleteCustomPrice(productId, retailerId, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/custom_prices?product_id=eq.${productId}&retailer_id=eq.${retailerId}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر حذف السعر");
}

// ============ DESIGN TOKENS (shared across whole app) ============
const TEAL = "#0E5C56";
const GOLD = "#C9932A";
const CLAY = "#A8482E";
const INK = "#16232B";
const SURFACE = "#FBF7EE";
const MUTED = "#6B6053";
const BORDER = "#E7DFCF";

const FONTS = (
  <link
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Cairo:wght@700;800;900&display=swap"
    rel="stylesheet"
  />
);

// ============ ROLE DEFINITIONS ============
const ROLES = [
  {
    id: "retail",
    label: "تاجر تجزئة",
    sub: "اشتري بالجملة لمحلك",
    accent: TEAL,
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <path d="M10 18L14 8H34L38 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 18H40V38C40 39.1 39.1 40 38 40H10C8.9 40 8 39.1 8 38V18Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M18 40V28H30V40" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "wholesale",
    label: "تاجر جملة",
    sub: "اعرض بضاعتك للتجار",
    accent: GOLD,
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <path d="M6 14L24 6L42 14L24 22L6 14Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M6 14V32L24 42L42 32V14" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M24 22V42" stroke="currentColor" strokeWidth="2.5"/>
      </svg>
    ),
  },
  {
    id: "driver",
    label: "سائق توصيل",
    sub: "وصّل الطلبات وتابع رحلاتك",
    accent: CLAY,
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <path d="M6 30V16C6 14.9 6.9 14 8 14H28C29.1 14 30 14.9 30 16V30" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M30 20H37L42 27V30H30V20Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
        <circle cx="14" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="35" cy="34" r="4" stroke="currentColor" strokeWidth="2.5"/>
      </svg>
    ),
  },
];

function ZelligePattern({ color }) {
  return (
    <svg width="100%" height="100%" className="absolute inset-0 opacity-5" style={{ color }}>
      <defs>
        <pattern id="zellige" width="56" height="56" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M28 4 L36 14 L28 24 L20 14 Z" />
            <path d="M28 32 L36 42 L28 52 L20 42 Z" />
            <path d="M4 28 L14 20 L24 28 L14 36 Z" />
            <path d="M32 28 L42 20 L52 28 L42 36 Z" />
            <circle cx="28" cy="28" r="6" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zellige)" />
    </svg>
  );
}

function Pill({ children, tone }) {
  const map = { gold: { bg: `${GOLD}18`, color: GOLD }, teal: { bg: `${TEAL}18`, color: TEAL }, clay: { bg: `${CLAY}18`, color: CLAY }, muted: { bg: "#00000008", color: MUTED } };
  const s = map[tone] || map.muted;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{children}</span>;
}

// ============ TOP NAV (shared shell for all logged-in screens) ============
function AppHeader({ user, onLogout, accent, tabs, activeTab, onTabChange, extra }) {
  return (
    <header className="sticky top-0 z-20" style={{ background: "#FFFFFF", borderBottom: `1px solid ${BORDER}` }}>
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>سوق الجملة</h1>
          <p className="text-xs" style={{ color: MUTED }}>{user.name} · {user.roleLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {extra}
          <button
            onClick={onLogout}
            className="text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ color: MUTED, border: `1px solid ${BORDER}` }}
          >
            خروج
          </button>
        </div>
      </div>
      {tabs && (
        <div className="max-w-5xl mx-auto px-5 flex gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const active = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className="px-4 py-3 text-sm font-semibold relative whitespace-nowrap"
                style={{ color: active ? accent : MUTED }}
              >
                {t.label}
                {active && <span className="absolute bottom-0 inset-x-2 h-1 rounded-full" style={{ background: accent }} />}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

// ============ LOGIN SCREEN ============
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("retail");
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const activeRole = ROLES.find((r) => r.id === role);

  const handleSubmit = async () => {
    setError("");
    if (!phone || !password) {
      setError("خاصك تكتب رقم الهاتف وكلمة المرور");
      return;
    }
    if (mode === "register" && !fullName) {
      setError("خاصك تكتب اسمك أو اسم المحل/المؤسسة");
      return;
    }
    setLoading(true);
    try {
      const email = phoneToEmail(phone);
      if (mode === "register") {
        const data = await supabaseSignUp(email, password, {
          role,
          full_name: fullName,
          phone,
        });
        if (!data.access_token) {
          // ماعندوش access_token مباشرة، نحاول ندخلو
          const signInData = await supabaseSignIn(email, password);
          const profile = await supabaseGetProfile(signInData.user.id, signInData.access_token);
          onLogin({ role: profile.role, roleLabel: activeRole.label, name: profile.full_name, userId: profile.id, accessToken: signInData.access_token });
        } else {
          const profile = await supabaseGetProfile(data.user.id, data.access_token);
          onLogin({ role: profile.role, roleLabel: ROLES.find((r) => r.id === profile.role)?.label, name: profile.full_name, userId: profile.id, accessToken: data.access_token });
        }
      } else {
        const data = await supabaseSignIn(email, password);
        const profile = await supabaseGetProfile(data.user.id, data.access_token);
        if (!profile) throw new Error("الحساب موجود لكن بياناته ناقصة، جرب تسجل من جديد");
        onLogin({ role: profile.role, roleLabel: ROLES.find((r) => r.id === profile.role)?.label, name: profile.full_name, userId: profile.id, accessToken: data.access_token });
      }
    } catch (e) {
      setError(e.message || "صار خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: SURFACE, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {FONTS}
      <ZelligePattern color={activeRole.accent} />
      <div className="relative z-10 w-full max-w-md px-5 py-8">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "'Cairo', sans-serif", color: INK }}>سوق الجملة</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>منصة التجارة بالجملة، بأسعارك الخاصة</p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}>
          <div className="grid grid-cols-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            {ROLES.map((r) => {
              const active = r.id === role;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="flex flex-col items-center gap-1.5 py-4 px-2 transition-all duration-200"
                  style={{ color: active ? r.accent : "#A79E8E", background: active ? `${r.accent}12` : "transparent", borderBottom: active ? `2.5px solid ${r.accent}` : "2.5px solid transparent" }}
                >
                  {r.icon}
                  <span className="text-xs font-semibold">{r.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-6 py-6">
            <p className="text-xs mb-5" style={{ color: MUTED }}>{activeRole.sub}</p>
            <div className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: INK }}>
                    {role === "driver" ? "الاسم الكامل" : "اسم المحل أو المؤسسة"}
                  </label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={role === "driver" ? "مثلاً: يوسف بلحاج" : "مثلاً: محل بركة الشرق"}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                    style={{ border: `1.5px solid ${BORDER}`, background: SURFACE, color: INK }}
                    onFocus={(e) => (e.target.style.borderColor = activeRole.accent)}
                    onBlur={(e) => (e.target.style.borderColor = BORDER)} />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: INK }}>رقم الهاتف</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0555 12 34 56"
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                  style={{ border: `1.5px solid ${BORDER}`, background: SURFACE, color: INK }}
                  onFocus={(e) => (e.target.style.borderColor = activeRole.accent)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: INK }}>كلمة المرور</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                  style={{ border: `1.5px solid ${BORDER}`, background: SURFACE, color: INK }}
                  onFocus={(e) => (e.target.style.borderColor = activeRole.accent)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)} />
              </div>
              {error && (
                <div className="rounded-lg px-3 py-2.5 text-xs font-semibold" style={{ background: `${CLAY}12`, color: CLAY }}>
                  {error}
                </div>
              )}
              <button type="button" onClick={handleSubmit} disabled={loading} className="w-full rounded-lg py-3 text-sm font-bold text-white transition-transform active:scale-95" style={{ background: activeRole.accent, opacity: loading ? 0.6 : 1 }}>
                {loading ? "جاري التحميل..." : mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
              </button>
              <div className="text-center pt-1">
                <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="text-xs font-semibold" style={{ color: activeRole.accent }}>
                  {mode === "login" ? "ماعندكش حساب؟ سجل كـ " + activeRole.label : "عندك حساب؟ دخل من هنا"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: "#A79E8E" }}>سوق الجملة © 2026 — الجزائر</p>
      </div>
    </div>
  );
}

// ============ RETAIL DASHBOARD ============
const CATEGORIES = [
  { id: "all", label: "الكل" }, { id: "grocery", label: "بقالة" }, { id: "dairy", label: "ألبان" },
  { id: "sweets", label: "حلويات وشوكولاطة" }, { id: "drinks", label: "مشروبات" },
];

function RetailDashboard({ user, onLogout }) {
  const [activeCat, setActiveCat] = useState("all");
  const [cart, setCart] = useState({});
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const rows = await supabaseGetProductsForRetailer(user.userId, user.accessToken);
        const normalized = rows.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          cat: p.category || "grocery",
          price: p.custom_prices && p.custom_prices.length > 0 ? Number(p.custom_prices[0].price) : Number(p.base_price),
          image_url: p.image_url,
        }));
        setProducts(normalized);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = products.filter((p) => (activeCat === "all" || p.cat === activeCat) && p.name.includes(query));
  const addToCart = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const changeQty = (id, delta) => setCart((c) => {
    const next = Math.max(0, (c[id] || 0) + delta);
    const updated = { ...c, [id]: next };
    if (next === 0) delete updated[id];
    return updated;
  });
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((p) => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  return (
    <div dir="rtl" className="min-h-screen w-full" style={{ background: SURFACE, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {FONTS}
      <AppHeader
        user={user}
        onLogout={onLogout}
        accent={TEAL}
        extra={
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm relative" style={{ background: TEAL }}>
            {cartCount > 9 ? "9+" : cartCount}
          </div>
        }
      />
      <main className="max-w-5xl mx-auto px-5 py-6">
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="rounded-xl p-4 flex-1 min-w-max" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-medium" style={{ color: MUTED }}>المنتجات المتوفرة</p>
            <p className="text-xl font-black mt-1" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>{products.length}</p>
          </div>
          <div className="rounded-xl p-4 flex-1 min-w-max" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-medium" style={{ color: MUTED }}>سلة الشراء</p>
            <p className="text-xl font-black mt-1" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>{cartTotal.toLocaleString()} د.ج</p>
          </div>
          <div className="rounded-xl p-4 flex-1 min-w-max" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-medium" style={{ color: MUTED }}>أسعارك الخاصة</p>
            <p className="text-xl font-black mt-1" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>نشطة</p>
            <p className="text-xs mt-0.5" style={{ color: GOLD }}>غير مرئية للتجار الآخرين</p>
          </div>
        </div>

        <input type="text" placeholder="ابحث عن منتج..." value={query} onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg px-4 py-3 text-sm outline-none mb-4" style={{ border: `1.5px solid ${BORDER}`, background: "#FFF", color: INK }} />

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => {
            const active = c.id === activeCat;
            return (
              <button key={c.id} onClick={() => setActiveCat(c.id)} className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors"
                style={{ background: active ? TEAL : "#FFF", color: active ? "#FFF" : MUTED, border: `1px solid ${active ? TEAL : BORDER}` }}>
                {c.label}
              </button>
            );
          })}
        </div>

        {loading && <p className="text-center text-sm py-10" style={{ color: MUTED }}>جاري التحميل...</p>}
        {!loading && products.length === 0 && (
          <p className="text-center text-sm py-16" style={{ color: MUTED }}>ماكانش منتجات متوفرة حالياً، رجع بعد شوية</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-24">
          {filtered.map((p) => {
            const qty = cart[p.id] || 0;
            return (
              <div key={p.id} className="rounded-xl p-4 flex gap-3" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center text-2xl shrink-0" style={{ background: `${TEAL}12` }}>
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: INK }}>{p.name}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{p.unit}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-sm font-black" style={{ color: TEAL, fontFamily: "'Cairo', sans-serif" }}>{p.price.toLocaleString()} د.ج</span>
                      <span className="text-xs block" style={{ color: GOLD }}>سعرك الخاص</span>
                    </div>
                    {qty === 0 ? (
                      <button onClick={() => addToCart(p.id)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: TEAL }}>أضف</button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg" style={{ border: `1px solid ${TEAL}` }}>
                        <button onClick={() => changeQty(p.id, -1)} className="px-2.5 py-1.5 text-sm font-bold" style={{ color: TEAL }}>−</button>
                        <span className="text-xs font-bold" style={{ color: INK }}>{qty}</span>
                        <button onClick={() => changeQty(p.id, 1)} className="px-2.5 py-1.5 text-sm font-bold" style={{ color: TEAL }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30">
          <div className="max-w-5xl mx-auto px-5 pb-4">
            <div className="rounded-xl px-5 py-4 flex items-center justify-between shadow-xl" style={{ background: INK }}>
              <div>
                <p className="text-xs" style={{ color: "#C9BFA9" }}>{cartCount} منتج في السلة</p>
                <p className="text-base font-black text-white" style={{ fontFamily: "'Cairo', sans-serif" }}>{cartTotal.toLocaleString()} د.ج</p>
              </div>
              <button className="rounded-lg px-5 py-2.5 text-sm font-bold text-white" style={{ background: GOLD }}>إتمام الطلب</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ WHOLESALE DASHBOARD ============
function AddProductModal({ user, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("grocery");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setError("");
    if (!name || !unit || !basePrice) {
      setError("خاصك تكتب على الأقل الاسم والوحدة والسعر");
      return;
    }
    setLoading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const path = `${user.userId}/${Date.now()}-${imageFile.name.replace(/\s+/g, "-")}`;
        imageUrl = await supabaseUploadImage(imageFile, path, user.accessToken);
      }
      const product = await supabaseInsertProduct({
        wholesaler_id: user.userId,
        name,
        unit,
        base_price: Number(basePrice),
        stock: Number(stock) || 0,
        category,
        image_url: imageUrl,
      }, user.accessToken);
      onAdded(product);
    } catch (e) {
      setError(e.message || "صار خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" style={{ background: "#00000060" }} onClick={onClose}>
      <div dir="rtl" className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ background: "#FFF" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black" style={{ color: INK }}>منتج جديد</h3>
          <button onClick={onClose} className="text-sm font-bold" style={{ color: MUTED }}>✕</button>
        </div>

        <label className="block mb-4">
          <div className="w-full h-32 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: SURFACE, border: `1.5px dashed ${BORDER}` }}>
            {imagePreview ? (
              <img src={imagePreview} alt="معاينة" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs" style={{ color: MUTED }}>اضغط لاختيار صورة المنتج</span>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
        </label>

        <div className="space-y-3">
          <input type="text" placeholder="اسم المنتج" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: INK }} />
          <input type="text" placeholder="الوحدة (مثلاً: كرتون / 4 وحدات)" value={unit} onChange={(e) => setUnit(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: INK }} />
          <div className="flex gap-3">
            <input type="number" placeholder="السعر الأساسي (د.ج)" value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
              className="flex-1 rounded-lg px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: INK }} />
            <input type="number" placeholder="المخزون" value={stock} onChange={(e) => setStock(e.target.value)}
              className="flex-1 rounded-lg px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: INK }} />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: INK }}>
            {CATEGORIES.filter((c) => c.id !== "all").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>

          {error && <div className="rounded-lg px-3 py-2.5 text-xs font-semibold" style={{ background: `${CLAY}12`, color: CLAY }}>{error}</div>}

          <button onClick={handleSave} disabled={loading} className="w-full rounded-lg py-3 text-sm font-bold text-white" style={{ background: GOLD, opacity: loading ? 0.6 : 1 }}>
            {loading ? "جاري الحفظ..." : "حفظ المنتج"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WholesaleDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customPrices, setCustomPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const [prods, rets] = await Promise.all([
          supabaseGetMyProducts(user.userId, user.accessToken),
          supabaseGetRetailers(user.accessToken),
        ]);
        setProducts(prods);
        setRetailers(rets);
        if (prods.length > 0) setSelectedProduct(prods[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openPricing = async (productId) => {
    setSelectedProduct(productId);
    setTab("pricing");
    try {
      const prices = await supabaseGetCustomPricesForProduct(productId, user.accessToken);
      const map = {};
      prices.forEach((p) => { map[p.retailer_id] = p.price; });
      setCustomPrices((prev) => ({ ...prev, [productId]: map }));
    } catch (e) {
      console.error(e);
    }
  };

  const setPrice = async (retailerId, value) => {
    setCustomPrices((prev) => ({ ...prev, [selectedProduct]: { ...prev[selectedProduct], [retailerId]: value === "" ? undefined : Number(value) } }));
    try {
      if (value === "") {
        await supabaseDeleteCustomPrice(selectedProduct, retailerId, user.accessToken);
      } else {
        await supabaseUpsertCustomPrice(selectedProduct, retailerId, Number(value), user.accessToken);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const product = products.find((p) => p.id === selectedProduct);

  return (
    <div dir="rtl" className="min-h-screen w-full" style={{ background: SURFACE, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {FONTS}
      <AppHeader
        user={user} onLogout={onLogout} accent={GOLD}
        tabs={[{ id: "products", label: "منتجاتي" }, { id: "pricing", label: "الأسعار الخاصة" }, { id: "retailers", label: "التجار" }]}
        activeTab={tab} onTabChange={setTab}
        extra={<button onClick={() => setShowAddModal(true)} className="rounded-lg px-4 py-2 text-xs font-bold text-white" style={{ background: GOLD }}>+ منتج جديد</button>}
      />
      <main className="max-w-5xl mx-auto px-5 py-6">
        {loading && <p className="text-center text-sm py-10" style={{ color: MUTED }}>جاري التحميل...</p>}

        {!loading && tab === "products" && (
          <div className="space-y-3">
            {products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm mb-3" style={{ color: MUTED }}>ماعندكش منتجات بعد</p>
                <button onClick={() => setShowAddModal(true)} className="text-xs font-bold px-4 py-2 rounded-lg text-white" style={{ background: GOLD }}>أضف أول منتج</button>
              </div>
            )}
            {products.map((p) => (
              <div key={p.id} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-2xl" style={{ background: `${GOLD}12` }}>
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: INK }}>{p.name}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{p.unit}</p>
                  <div className="flex gap-2 mt-1.5">
                    <Pill tone="teal">السعر الأساسي {Number(p.base_price).toLocaleString()} د.ج</Pill>
                    <Pill tone={p.stock < 100 ? "gold" : "muted"}>المخزون {p.stock}</Pill>
                  </div>
                </div>
                <button onClick={() => openPricing(p.id)} className="text-xs font-bold px-3 py-2 rounded-lg shrink-0" style={{ color: GOLD, border: `1px solid ${GOLD}` }}>الأسعار الخاصة</button>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "pricing" && (
          products.length === 0 ? (
            <p className="text-center text-sm py-10" style={{ color: MUTED }}>زيد منتج أول من تبويب "منتجاتي"</p>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2" style={{ color: INK }}>اختر المنتج</label>
                <select value={selectedProduct || ""} onChange={(e) => openPricing(e.target.value)} className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, background: "#FFF", color: INK }}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="rounded-xl p-4 mb-4" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}40` }}>
                <p className="text-xs" style={{ color: INK }}><strong>هذي الأسعار خاصة</strong> — كل تاجر يشوف السعر المخصص ليه فقط، ومحفوظة فعلياً في قاعدة البيانات.</p>
              </div>
              {retailers.length === 0 ? (
                <p className="text-center text-sm py-6" style={{ color: MUTED }}>ماعندكش تجار مسجلين بعد</p>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                  {retailers.map((r, i) => {
                    const custom = customPrices[selectedProduct]?.[r.id];
                    return (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < retailers.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: INK }}>{r.full_name}</p>
                          <span className="text-xs" style={{ color: MUTED }}>{r.city || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input type="number" placeholder={product ? Number(product.base_price).toString() : ""} value={custom ?? ""} onChange={(e) => setPrice(r.id, e.target.value)} className="w-24 rounded-lg px-3 py-2 text-sm text-left outline-none" style={{ border: `1.5px solid ${custom ? TEAL : BORDER}`, color: INK }} />
                          <span className="text-xs" style={{ color: MUTED }}>د.ج</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {product && <p className="text-xs mt-2" style={{ color: MUTED }}>اترك الحقل فارغ باش يتفعل السعر الأساسي ({Number(product.base_price).toLocaleString()} د.ج) تلقائياً.</p>}
            </div>
          )
        )}

        {!loading && tab === "retailers" && (
          <div className="space-y-3">
            {retailers.length === 0 && <p className="text-center text-sm py-10" style={{ color: MUTED }}>ماعندكش تجار مسجلين بعد</p>}
            {retailers.map((r) => (
              <div key={r.id} className="rounded-xl p-4 flex items-center justify-between" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: INK }}>{r.full_name}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{r.city || "—"} · {r.phone || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddProductModal
          user={user}
          onClose={() => setShowAddModal(false)}
          onAdded={(newProduct) => {
            setProducts((prev) => [newProduct, ...prev]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// ============ DRIVER DASHBOARD ============
const STATUS_FLOW = ["مقبول", "في الطريق للمورد", "تم الاستلام", "في الطريق للزبون", "تم التسليم"];
const INITIAL_ORDERS = [
  { id: "SJ-1042", from: "مؤسسة النور للتوزيع، قسنطينة", to: "محل بركة الشرق، الخروب", items: "3 كراتين زيت + 2 كيس سكر", distance: "12 كم", fee: 800, statusIdx: 1 },
  { id: "SJ-1043", from: "الأطلس للتوزيع، قسنطينة", to: "بقالة الأمانة، عين السمارة", items: "1 كيس حليب مجفف", distance: "18 كم", fee: 1100, statusIdx: 0 },
];
const HISTORY = [
  { id: "SJ-1038", to: "سوبيرات النجاح، سطيف", fee: 1400, date: "أمس" },
  { id: "SJ-1035", to: "محلات وادي الزناتي، عنابة", fee: 2200, date: "قبل يومين" },
];

function OrderCard({ order, onAdvance }) {
  const isDone = order.statusIdx >= STATUS_FLOW.length - 1;
  return (
    <div className="rounded-xl p-4" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold" style={{ color: MUTED }}>{order.id}</span>
        <Pill tone="clay">{order.fee.toLocaleString()} د.ج</Pill>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: GOLD }} />
          <div><p className="text-xs" style={{ color: MUTED }}>الاستلام من</p><p className="text-sm font-semibold" style={{ color: INK }}>{order.from}</p></div>
        </div>
        <div className="border-r-2 border-dotted mr-1 h-3" style={{ borderColor: BORDER }} />
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: TEAL }} />
          <div><p className="text-xs" style={{ color: MUTED }}>التسليم إلى</p><p className="text-sm font-semibold" style={{ color: INK }}>{order.to}</p></div>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: MUTED }}>
        <span>📦 {order.items}</span><span>📍 {order.distance}</span>
      </div>
      <div className="flex items-center gap-1 mb-3">
        {STATUS_FLOW.map((s, i) => <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: i <= order.statusIdx ? TEAL : BORDER }} />)}
      </div>
      <p className="text-xs font-semibold mb-3" style={{ color: TEAL }}>الحالة: {STATUS_FLOW[order.statusIdx]}</p>
      {!isDone ? (
        <button onClick={() => onAdvance(order.id)} className="w-full rounded-lg py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>تأكيد: {STATUS_FLOW[order.statusIdx + 1]}</button>
      ) : (
        <div className="text-center py-1"><span className="text-xs font-bold" style={{ color: GOLD }}>✓ تم التسليم بنجاح</span></div>
      )}
    </div>
  );
}

function DriverDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [tab, setTab] = useState("active");
  const [online, setOnline] = useState(true);
  const advance = (id) => setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statusIdx: Math.min(o.statusIdx + 1, STATUS_FLOW.length - 1) } : o)));
  const todayEarnings = orders.reduce((s, o) => s + (o.statusIdx >= STATUS_FLOW.length - 1 ? o.fee : 0), 0);
  const activeCount = orders.filter((o) => o.statusIdx < STATUS_FLOW.length - 1).length;

  return (
    <div dir="rtl" className="min-h-screen w-full" style={{ background: SURFACE, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {FONTS}
      <AppHeader
        user={user} onLogout={onLogout} accent={CLAY}
        tabs={[{ id: "active", label: `طلبات نشطة (${activeCount})` }, { id: "history", label: "السجل" }]}
        activeTab={tab} onTabChange={setTab}
        extra={
          <button onClick={() => setOnline((v) => !v)} className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold" style={{ background: online ? `${TEAL}15` : "#00000008", color: online ? TEAL : MUTED, border: `1px solid ${online ? TEAL : BORDER}` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: online ? TEAL : MUTED }} />
            {online ? "متصل" : "غير متصل"}
          </button>
        }
      />
      <main className="max-w-5xl mx-auto px-5 py-6">
        <div className="rounded-xl p-4 mb-5 flex items-center justify-between" style={{ background: INK }}>
          <div>
            <p className="text-xs" style={{ color: "#C9BFA9" }}>أرباح اليوم</p>
            <p className="text-2xl font-black text-white" style={{ fontFamily: "'Cairo', sans-serif" }}>{todayEarnings.toLocaleString()} د.ج</p>
          </div>
          <div className="text-left">
            <p className="text-xs" style={{ color: "#C9BFA9" }}>رحلات مكتملة</p>
            <p className="text-lg font-bold text-white">{orders.filter((o) => o.statusIdx >= STATUS_FLOW.length - 1).length}</p>
          </div>
        </div>
        {!online && (
          <div className="rounded-xl p-4 mb-5 text-center" style={{ background: `${CLAY}10`, border: `1px solid ${CLAY}40` }}>
            <p className="text-xs font-semibold" style={{ color: CLAY }}>أنت غير متصل — لن تصلك طلبات جديدة. فعّل الاتصال من الأعلى.</p>
          </div>
        )}
        {tab === "active" && (
          <div className="space-y-3">
            {orders.length > 0 ? orders.map((o) => <OrderCard key={o.id} order={o} onAdvance={advance} />) : <p className="text-center text-sm py-10" style={{ color: MUTED }}>ماعندكش طلبات نشطة حالياً</p>}
          </div>
        )}
        {tab === "history" && (
          <div className="space-y-2">
            {HISTORY.map((h) => (
              <div key={h.id} className="rounded-xl p-4 flex items-center justify-between" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <div><p className="text-sm font-bold" style={{ color: INK }}>{h.to}</p><p className="text-xs" style={{ color: MUTED }}>{h.id} · {h.date}</p></div>
                <span className="text-sm font-black" style={{ color: TEAL, fontFamily: "'Cairo', sans-serif" }}>{h.fee.toLocaleString()} د.ج</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ============ ROOT APP — the router ============
export default function SouqJumlaApp() {
  const [user, setUser] = useState(null); // null = logged out

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => setUser(null);

  if (!user) return <LoginScreen onLogin={handleLogin} />;
  if (user.role === "retail") return <RetailDashboard user={user} onLogout={handleLogout} />;
  if (user.role === "wholesale") return <WholesaleDashboard user={user} onLogout={handleLogout} />;
  if (user.role === "driver") return <DriverDashboard user={user} onLogout={handleLogout} />;
  return null;
}
