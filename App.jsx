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

async function supabaseUpdateProfile(userId, fields, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json", apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`, Prefer: "return=representation",
    },
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("تعذر حفظ التعديلات");
  return data[0];
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?role=eq.retail&select=id,full_name,city,phone,address`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر جلب التجار");
  return res.json();
}

async function supabaseGetProfilesByIds(ids, accessToken) {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=in.(${uniqueIds.join(",")})&select=id,full_name,phone,address,city`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر جلب بيانات الأطراف");
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

// إنشاء طلب واحد + عناصره لمورد معيّن
async function supabaseCreateOrder(retailerId, wholesalerId, items, accessToken) {
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`, Prefer: "return=representation",
    },
    body: JSON.stringify({ retailer_id: retailerId, wholesaler_id: wholesalerId, status: "pending", total }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("تعذر إنشاء الطلب");
  const order = data[0];

  const itemsRes = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(items.map((it) => ({ order_id: order.id, product_id: it.id, product_name: it.name, quantity: it.qty, unit_price: it.price }))),
  });
  if (!itemsRes.ok) throw new Error("تعذر حفظ تفاصيل الطلب");
  return order;
}

async function supabaseGetRetailerOrders(retailerId, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?retailer_id=eq.${retailerId}&select=*&order=created_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر جلب الطلبات");
  return res.json();
}

async function supabaseGetWholesalerOrders(wholesalerId, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?wholesaler_id=eq.${wholesalerId}&select=*,order_items(*)&order=created_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر جلب الطلبات");
  return res.json();
}

async function supabaseGetAvailableOrdersForDriver(accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?status=eq.ready&driver_id=is.null&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر جلب الطلبات المتاحة");
  return res.json();
}

async function supabaseGetDriverOrders(driverId, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?driver_id=eq.${driverId}&select=*&order=created_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("تعذر جلب طلباتك");
  return res.json();
}

async function supabaseUpdateOrderStatus(orderId, fields, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json", apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`, Prefer: "return=representation",
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("تعذر تحديث الطلب");
  return res.json();
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
function AppHeader({ user, onLogout, accent, tabs, activeTab, onTabChange, extra, onOpenProfile }) {
  return (
    <header className="sticky top-0 z-20" style={{ background: "#FFFFFF", borderBottom: `1px solid ${BORDER}` }}>
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <button onClick={onOpenProfile} className="text-right" disabled={!onOpenProfile}>
          <h1 className="text-lg font-black" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>سوق الجملة</h1>
          <p className="text-xs flex items-center gap-1" style={{ color: MUTED }}>
            {user.name} · {user.roleLabel}
            {onOpenProfile && <span style={{ color: accent }}>✏️</span>}
          </p>
        </button>
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
function CornerFlourish({ flip }) {
  return (
    <svg viewBox="0 0 120 120" className="absolute w-16 h-16" style={{ color: GOLD, opacity: 0.35, transform: flip ? "scaleX(-1) scaleY(-1)" : "none", top: flip ? "auto" : 0, bottom: flip ? 0 : "auto", right: 0 }}>
      <path d="M0 40 C0 15 15 0 40 0 L120 0" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M0 60 C0 25 25 0 60 0" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function LeafIcon({ className, style }) {
  return (
    <svg viewBox="0 0 60 100" className={className} style={style}>
      <path d="M30 5 C50 20 52 55 30 95 C8 55 10 20 30 5Z" fill="currentColor" opacity="0.7" />
      <path d="M30 15 L30 88" stroke="#00000030" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function LandingPage({ onStart }) {
  const network = [
    { x: 22, y: 40, color: GOLD },
    { x: 50, y: 70, color: "#F4D35E" },
    { x: 78, y: 35, color: GOLD },
  ];
  return (
    <div dir="rtl" className="h-screen w-full relative overflow-hidden flex flex-col" style={{ background: SURFACE, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {FONTS}
      <ZelligePattern color={TEAL} />
      <div className="absolute top-0 right-0" style={{ color: "#8FA98F" }}>
        <LeafIcon className="w-14 h-24" style={{ transform: "rotate(20deg)" }} />
      </div>
      <div className="absolute bottom-16 left-0" style={{ color: "#8FA98F" }}>
        <LeafIcon className="w-12 h-20" style={{ transform: "rotate(-30deg)" }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-2xl w-full mx-auto px-6 py-6 min-h-0">
        {/* Hero */}
        <div className="text-center shrink-0 rounded-3xl px-5 pt-7 pb-6 relative overflow-hidden" style={{ background: `linear-gradient(150deg, ${INK} 0%, #1F3B3A 55%, ${TEAL} 100%)`, boxShadow: "0 10px 30px rgba(15,60,55,0.25)" }}>
          <CornerFlourish />
          <CornerFlourish flip />
          <svg width="100%" height="100%" className="absolute inset-0" style={{ color: "#FFF", opacity: 0.07 }}>
            <defs>
              <pattern id="landing-zellige" width="48" height="48" patternUnits="userSpaceOnUse">
                <g fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M24 3 L31 12 L24 21 L17 12 Z" />
                  <circle cx="24" cy="24" r="4" />
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#landing-zellige)" />
          </svg>
          <div className="relative inline-flex items-center justify-center mb-3">
            <StarBadge>خاص<br />بيك</StarBadge>
          </div>
          <h1 className="relative text-3xl font-black tracking-tight mb-2" style={{ fontFamily: "'Cairo', sans-serif", color: "#FFF" }}>سوق الجملة</h1>
          <div className="relative w-10 h-0.5 rounded-full mx-auto mb-3" style={{ background: GOLD }} />
          <p className="relative text-sm leading-relaxed px-2 mb-4" style={{ color: "#D9E4E2" }}>
            منصة تربط تجار التجزئة بموردي الجملة وسائقي التوصيل في الجزائر — مباشرة، بلا وسطاء.
          </p>

          {/* Glowing network visual */}
          <div className="relative mx-auto" style={{ width: "100%", maxWidth: 220, height: 90 }}>
            <svg viewBox="0 0 100 90" className="absolute inset-0 w-full h-full">
              <path d={`M${network[0].x} ${network[0].y} Q 36 5 ${network[1].x} ${network[1].y}`} fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.7" />
              <path d={`M${network[1].x} ${network[1].y} Q 64 12 ${network[2].x} ${network[2].y}`} fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.7" />
              {network.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill={p.color} opacity="0.25" />
                  <circle cx={p.x} cy={p.y} r="2" fill={p.color} />
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Role badges */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          {ROLES.map((r) => (
            <div key={r.id} className="rounded-2xl py-4 px-2 text-center" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: r.accent, color: "#FFF" }}>
                <div style={{ transform: "scale(0.75)" }}>{r.icon}</div>
              </div>
              <p className="text-xs font-black" style={{ color: INK }}>{r.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <button onClick={onStart} className="w-full rounded-full py-4 text-sm font-black text-white transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2" style={{ background: `linear-gradient(90deg, ${TEAL}, #0A4A45)` }}>
            <span style={{ color: GOLD }}>✦</span>
            ابدأ الآن — سجل حسابك مجاناً
          </button>
          <p className="text-center text-xs mt-3" style={{ color: "#A79E8E" }}>سوق الجملة © 2026 — الجزائر</p>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, onBack }) {
  const [role, setRole] = useState("retail");
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");
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
    if (mode === "register" && role !== "driver" && !address) {
      setError("خاصك تكتب عنوان المحل/المؤسسة بدقة");
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
          address,
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
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1.5 mb-4 text-sm font-semibold" style={{ color: MUTED }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            رجوع
          </button>
        )}
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
              {mode === "register" && role !== "driver" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: INK }}>العنوان بالتفصيل</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="مثلاً: حي النصر، شارع 5 جويلية، قسنطينة"
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                    style={{ border: `1.5px solid ${BORDER}`, background: SURFACE, color: INK }}
                    onFocus={(e) => (e.target.style.borderColor = activeRole.accent)}
                    onBlur={(e) => (e.target.style.borderColor = BORDER)} />
                  <p className="text-xs mt-1" style={{ color: MUTED }}>هذا العنوان يشوفو السائق باش يوصل الطلبية</p>
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
                  {mode === "login" ? "ليس لديك حساب؟ سجّل " + (role === "wholesale" ? "كـتاجر جملة" : role === "driver" ? "كـسائق توصيل" : "كـتاجر تجزئة") : "لديك حساب؟ سجّل الدخول من هنا"}
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

const ORDER_STATUS_LABELS = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  ready: "جاهز للتوصيل",
  picked_up: "في الطريق إليك",
  delivered: "تم التسليم",
};
const ORDER_STATUS_COLOR = {
  pending: GOLD, confirmed: TEAL, ready: TEAL, picked_up: CLAY, delivered: TEAL,
};

function StarBadge({ children }) {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <path
          d="M50 2 L61 30 L91 26 L72 50 L91 74 L61 70 L50 98 L39 70 L9 74 L28 50 L9 26 L39 30 Z"
          fill={GOLD}
        />
      </svg>
      <span className="relative text-white font-black text-xs leading-tight text-center" style={{ fontFamily: "'Cairo', sans-serif" }}>{children}</span>
    </div>
  );
}

function PromoBanner({ products, onAdd }) {
  const featured = products.filter((p) => p.image_url).slice(0, 6);
  if (featured.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-5 rounded-full" style={{ background: GOLD }} />
        <h2 className="text-sm font-black" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>عروض مميزة عندك</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
        {featured.map((p) => (
          <div key={p.id} className="relative shrink-0 w-40 rounded-2xl overflow-hidden shadow-sm" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
            <div className="h-24 w-full overflow-hidden" style={{ background: `${TEAL}12` }}>
              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-1 -left-1">
              <StarBadge>{p.price >= 1000 ? `${Math.round(p.price / 1000)}k` : p.price}<br />د.ج</StarBadge>
            </div>
            <div className="p-3">
              <p className="text-xs font-bold truncate mb-2" style={{ color: INK }}>{p.name}</p>
              <button onClick={() => onAdd(p.id)} className="w-full rounded-lg py-1.5 text-xs font-bold text-white" style={{ background: TEAL }}>أضف للسلة</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RetailDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("products");
  const [activeCat, setActiveCat] = useState("all");
  const [cart, setCart] = useState({});
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [driverProfiles, setDriverProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user.name);

  const loadProducts = async () => {
    try {
      const rows = await supabaseGetProductsForRetailer(user.userId, user.accessToken);
      const normalized = rows.map((p) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        cat: p.category || "grocery",
        wholesalerId: p.wholesaler_id,
        price: p.custom_prices && p.custom_prices.length > 0 ? Number(p.custom_prices[0].price) : Number(p.base_price),
        image_url: p.image_url,
      }));
      setProducts(normalized);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const rows = await supabaseGetRetailerOrders(user.userId, user.accessToken);
      setOrders(rows);
      const driverIds = rows.map((o) => o.driver_id).filter(Boolean);
      if (driverIds.length > 0) {
        const profs = await supabaseGetProfilesByIds(driverIds, user.accessToken);
        const map = {};
        profs.forEach((p) => { map[p.id] = p; });
        setDriverProfiles(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => { loadProducts(); loadOrders(); }, []);

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

  const handleCheckout = async () => {
    setCheckoutError("");
    setCheckoutLoading(true);
    try {
      // نجمع عناصر السلة حسب المورد، لأن كل طلب يخص مورد واحد
      const byWholesaler = {};
      Object.entries(cart).forEach(([id, qty]) => {
        const p = products.find((pp) => pp.id === id);
        if (!p) return;
        if (!byWholesaler[p.wholesalerId]) byWholesaler[p.wholesalerId] = [];
        byWholesaler[p.wholesalerId].push({ id: p.id, name: p.name, price: p.price, qty });
      });
      for (const wholesalerId of Object.keys(byWholesaler)) {
        await supabaseCreateOrder(user.userId, wholesalerId, byWholesaler[wholesalerId], user.accessToken);
      }
      setCart({});
      setCheckoutSuccess(true);
      await loadOrders();
      setTimeout(() => { setCheckoutSuccess(false); setTab("orders"); }, 1200);
    } catch (e) {
      setCheckoutError(e.message || "تعذر إتمام الطلب، حاول مرة أخرى");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen w-full" style={{ background: SURFACE, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {FONTS}
      <AppHeader
        user={{ ...user, name: displayName }}
        onLogout={onLogout}
        accent={TEAL}
        onOpenProfile={() => setShowProfile(true)}
        tabs={[{ id: "products", label: "المنتجات" }, { id: "orders", label: `طلباتي (${orders.length})` }]}
        activeTab={tab} onTabChange={setTab}
        extra={
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm relative" style={{ background: TEAL }}>
            {cartCount > 9 ? "9+" : cartCount}
          </div>
        }
      />
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSaved={(updated) => { setDisplayName(updated.name); setShowProfile(false); }}
        />
      )}
      <main className="max-w-5xl mx-auto px-5 py-6">
        {tab === "products" && (
          <>
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
                <p className="text-xs font-medium" style={{ color: MUTED }}>إجمالي مشترياتك</p>
                <p className="text-xl font-black mt-1" style={{ color: TEAL, fontFamily: "'Cairo', sans-serif" }}>{orders.reduce((s, o) => s + Number(o.total), 0).toLocaleString()} د.ج</p>
              </div>
              <div className="rounded-xl p-4 flex-1 min-w-max" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-medium" style={{ color: MUTED }}>أسعارك الخاصة</p>
                <p className="text-xl font-black mt-1" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>نشطة</p>
                <p className="text-xs mt-0.5" style={{ color: GOLD }}>غير مرئية للتجار الآخرين</p>
              </div>
            </div>

            <PromoBanner products={products} onAdd={addToCart} />

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
          </>
        )}

        {tab === "orders" && (
          <div className="space-y-3 mb-10">
            {orders.length === 0 && <p className="text-center text-sm py-16" style={{ color: MUTED }}>ماعندكش طلبات بعد</p>}
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl p-4" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: MUTED }}>#{o.id.slice(0, 8)}</span>
                  <Pill tone="teal">{ORDER_STATUS_LABELS[o.status] || o.status}</Pill>
                </div>
                <p className="text-base font-black" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>{Number(o.total).toLocaleString()} د.ج</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>{new Date(o.created_at).toLocaleDateString("ar-DZ")}</p>
                {o.driver_id && driverProfiles[o.driver_id] && (
                  <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <span className="text-xs" style={{ color: MUTED }}>السائق: {driverProfiles[o.driver_id].full_name}</span>
                    <span className="text-xs font-bold" style={{ color: TEAL }}>{driverProfiles[o.driver_id].phone}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {tab === "products" && cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30">
          <div className="max-w-5xl mx-auto px-5 pb-4">
            <div className="rounded-xl px-5 py-4 shadow-xl" style={{ background: INK }}>
              {checkoutError && (
                <p className="text-xs font-semibold mb-2" style={{ color: "#FF9B85" }}>{checkoutError}</p>
              )}
              {checkoutSuccess ? (
                <p className="text-center text-sm font-bold py-2" style={{ color: GOLD }}>✓ تم إرسال طلبك بنجاح</p>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: "#C9BFA9" }}>{cartCount} منتج في السلة</p>
                    <p className="text-base font-black text-white" style={{ fontFamily: "'Cairo', sans-serif" }}>{cartTotal.toLocaleString()} د.ج</p>
                  </div>
                  <button onClick={handleCheckout} disabled={checkoutLoading} className="rounded-lg px-5 py-2.5 text-sm font-bold text-white" style={{ background: GOLD, opacity: checkoutLoading ? 0.6 : 1 }}>
                    {checkoutLoading ? "جاري الإرسال..." : "إتمام الطلب"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ WHOLESALE DASHBOARD ============
function ProfileModal({ user, onClose, onSaved }) {
  const [fullName, setFullName] = useState(user.name || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const profile = await supabaseGetProfile(user.userId, user.accessToken);
        if (profile) {
          setFullName(profile.full_name || "");
          setAddress(profile.address || "");
          setCity(profile.city || "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setError("");
    if (!fullName) {
      setError("خاصك تكتب الاسم");
      return;
    }
    setLoading(true);
    try {
      await supabaseUpdateProfile(user.userId, { full_name: fullName, address, city }, user.accessToken);
      onSaved({ name: fullName, address, city });
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
          <h3 className="text-base font-black" style={{ color: INK }}>الملف الشخصي</h3>
          <button onClick={onClose} className="text-sm font-bold" style={{ color: MUTED }}>✕</button>
        </div>
        <div className="space-y-3">
          {fetching && <p className="text-center text-xs py-4" style={{ color: MUTED }}>جاري التحميل...</p>}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: INK }}>الاسم / اسم المحل</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: INK }} />
          </div>
          {user.role !== "driver" && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: INK }}>العنوان بالتفصيل</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="مثلاً: حي النصر، شارع 5 جويلية"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: INK }} />
              <p className="text-xs mt-1" style={{ color: MUTED }}>هذا العنوان يشوفو السائق باش يوصل الطلبية</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: INK }}>المدينة</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="مثلاً: قسنطينة"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: INK }} />
          </div>
          {error && <div className="rounded-lg px-3 py-2.5 text-xs font-semibold" style={{ background: `${CLAY}12`, color: CLAY }}>{error}</div>}
          <button onClick={handleSave} disabled={loading} className="w-full rounded-lg py-3 text-sm font-bold text-white" style={{ background: TEAL, opacity: loading ? 0.6 : 1 }}>
            {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customPrices, setCustomPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user.name);

  const loadOrders = async () => {
    try {
      const rows = await supabaseGetWholesalerOrders(user.userId, user.accessToken);
      setOrders(rows);
    } catch (e) {
      console.error(e);
    }
  };

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
    loadOrders();
  }, []);

  const advanceOrder = async (orderId, nextStatus) => {
    try {
      await supabaseUpdateOrderStatus(orderId, { status: nextStatus }, user.accessToken);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    } catch (e) {
      console.error(e);
    }
  };

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
        user={{ ...user, name: displayName }} onLogout={onLogout} accent={GOLD}
        onOpenProfile={() => setShowProfile(true)}
        tabs={[{ id: "products", label: "منتجاتي" }, { id: "orders", label: `الطلبات (${orders.filter((o) => o.status === "pending").length})` }, { id: "pricing", label: "الأسعار الخاصة" }, { id: "retailers", label: "التجار" }]}
        activeTab={tab} onTabChange={setTab}
        extra={<button onClick={() => setShowAddModal(true)} className="rounded-lg px-4 py-2 text-xs font-bold text-white" style={{ background: GOLD }}>+ منتج جديد</button>}
      />
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSaved={(updated) => { setDisplayName(updated.name); setShowProfile(false); }}
        />
      )}
      <main className="max-w-5xl mx-auto px-5 py-6">
        {loading && <p className="text-center text-sm py-10" style={{ color: MUTED }}>جاري التحميل...</p>}

        {!loading && tab === "products" && (
          <div className="space-y-3">
            <div className="flex gap-3 mb-3 flex-wrap">
              <div className="rounded-xl p-4 flex-1 min-w-max" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-medium" style={{ color: MUTED }}>منتجاتك</p>
                <p className="text-xl font-black mt-1" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>{products.length}</p>
              </div>
              <div className="rounded-xl p-4 flex-1 min-w-max" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-medium" style={{ color: MUTED }}>طلبات قيد الانتظار</p>
                <p className="text-xl font-black mt-1" style={{ color: GOLD, fontFamily: "'Cairo', sans-serif" }}>{orders.filter((o) => o.status === "pending").length}</p>
              </div>
              <div className="rounded-xl p-4 flex-1 min-w-max" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-medium" style={{ color: MUTED }}>إجمالي المبيعات</p>
                <p className="text-xl font-black mt-1" style={{ color: TEAL, fontFamily: "'Cairo', sans-serif" }}>{orders.filter((o) => o.status !== "pending").reduce((s, o) => s + Number(o.total), 0).toLocaleString()} د.ج</p>
              </div>
            </div>
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

        {!loading && tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && <p className="text-center text-sm py-16" style={{ color: MUTED }}>ماعندكش طلبات بعد</p>}
            {orders.map((o) => {
              const retailer = retailers.find((r) => r.id === o.retailer_id);
              return (
              <div key={o.id} className="rounded-xl p-4" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: MUTED }}>#{o.id.slice(0, 8)}</span>
                  <Pill tone={o.status === "pending" ? "gold" : "teal"}>{ORDER_STATUS_LABELS[o.status] || o.status}</Pill>
                </div>
                {retailer && (
                  <p className="text-xs mb-2" style={{ color: MUTED }}>التاجر: <strong style={{ color: INK }}>{retailer.full_name}</strong> — {retailer.address || retailer.city || "بلا عنوان"} · {retailer.phone}</p>
                )}
                <div className="space-y-1 mb-3">
                  {(o.order_items || []).map((it) => (
                    <p key={it.id} className="text-xs" style={{ color: MUTED }}>{it.quantity} × {it.product_name} — {Number(it.unit_price * it.quantity).toLocaleString()} د.ج</p>
                  ))}
                </div>
                <p className="text-sm font-black mb-3" style={{ color: INK, fontFamily: "'Cairo', sans-serif" }}>المجموع: {Number(o.total).toLocaleString()} د.ج</p>
                {o.status === "pending" && (
                  <button onClick={() => advanceOrder(o.id, "confirmed")} className="w-full rounded-lg py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>تأكيد الطلب</button>
                )}
                {o.status === "confirmed" && (
                  <button onClick={() => advanceOrder(o.id, "ready")} className="w-full rounded-lg py-2.5 text-sm font-bold text-white" style={{ background: GOLD }}>تجهيز للتوصيل</button>
                )}
                {o.status === "ready" && (
                  <p className="text-xs text-center py-1" style={{ color: MUTED }}>بانتظار سائق يوكل الطلب</p>
                )}
                {(o.status === "picked_up" || o.status === "delivered") && (
                  <p className="text-xs text-center py-1 font-semibold" style={{ color: GOLD }}>✓ {o.status === "delivered" ? "تم التسليم" : "مع السائق في الطريق"}</p>
                )}
              </div>
            );})}
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
function OrderCard({ order, profiles, onAction, actionLabel, subLabel }) {
  const wholesaler = profiles?.[order.wholesaler_id];
  const retailer = profiles?.[order.retailer_id];
  return (
    <div className="rounded-xl p-4" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold" style={{ color: MUTED }}>#{order.id.slice(0, 8)}</span>
        <Pill tone="clay">{Number(order.total).toLocaleString()} د.ج</Pill>
      </div>
      {(wholesaler || retailer) && (
        <div className="space-y-2 mb-3">
          {wholesaler && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: GOLD }} />
              <div><p className="text-xs" style={{ color: MUTED }}>الاستلام من</p><p className="text-sm font-semibold" style={{ color: INK }}>{wholesaler.full_name} — {wholesaler.address || wholesaler.city || "بلا عنوان"}</p></div>
            </div>
          )}
          {retailer && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: TEAL }} />
              <div><p className="text-xs" style={{ color: MUTED }}>التسليم إلى</p><p className="text-sm font-semibold" style={{ color: INK }}>{retailer.full_name} — {retailer.address || retailer.city || "بلا عنوان"}</p></div>
            </div>
          )}
        </div>
      )}
      <p className="text-xs mb-3" style={{ color: MUTED }}>الحالة: {ORDER_STATUS_LABELS[order.status] || order.status}</p>
      {subLabel && <p className="text-xs mb-3" style={{ color: GOLD }}>{subLabel}</p>}
      {onAction && (
        <button onClick={() => onAction(order.id)} className="w-full rounded-lg py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>{actionLabel}</button>
      )}
    </div>
  );
}

function DriverDashboard({ user, onLogout }) {
  const [available, setAvailable] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [tab, setTab] = useState("active");
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user.name);

  const loadAll = async () => {
    try {
      const [avail, mine] = await Promise.all([
        supabaseGetAvailableOrdersForDriver(user.accessToken),
        supabaseGetDriverOrders(user.userId, user.accessToken),
      ]);
      setAvailable(avail);
      setMyOrders(mine);
      const ids = [...avail, ...mine].flatMap((o) => [o.wholesaler_id, o.retailer_id]);
      const profs = await supabaseGetProfilesByIds(ids, user.accessToken);
      const map = {};
      profs.forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadAll(); }, []);

  const acceptOrder = async (orderId) => {
    try {
      await supabaseUpdateOrderStatus(orderId, { driver_id: user.userId, status: "picked_up" }, user.accessToken);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const deliverOrder = async (orderId) => {
    try {
      await supabaseUpdateOrderStatus(orderId, { status: "delivered" }, user.accessToken);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const activeMyOrders = myOrders.filter((o) => o.status !== "delivered");
  const completedOrders = myOrders.filter((o) => o.status === "delivered");
  const todayEarnings = completedOrders.reduce((s, o) => s + Number(o.total) * 0.1, 0); // عمولة توضيحية 10%

  return (
    <div dir="rtl" className="min-h-screen w-full" style={{ background: SURFACE, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {FONTS}
      <AppHeader
        user={{ ...user, name: displayName }} onLogout={onLogout} accent={CLAY}
        onOpenProfile={() => setShowProfile(true)}
        tabs={[{ id: "active", label: `طلبات متاحة (${available.length})` }, { id: "mine", label: `طلباتي (${activeMyOrders.length})` }, { id: "history", label: "السجل" }]}
        activeTab={tab} onTabChange={setTab}
        extra={
          <button onClick={() => setOnline((v) => !v)} className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold" style={{ background: online ? `${TEAL}15` : "#00000008", color: online ? TEAL : MUTED, border: `1px solid ${online ? TEAL : BORDER}` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: online ? TEAL : MUTED }} />
            {online ? "متصل" : "غير متصل"}
          </button>
        }
      />
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSaved={(updated) => { setDisplayName(updated.name); setShowProfile(false); }}
        />
      )}
      <main className="max-w-5xl mx-auto px-5 py-6">
        <div className="rounded-xl p-4 mb-5 flex items-center justify-between" style={{ background: INK }}>
          <div>
            <p className="text-xs" style={{ color: "#C9BFA9" }}>أرباح اليوم (تقديرية)</p>
            <p className="text-2xl font-black text-white" style={{ fontFamily: "'Cairo', sans-serif" }}>{Math.round(todayEarnings).toLocaleString()} د.ج</p>
          </div>
          <div className="text-left">
            <p className="text-xs" style={{ color: "#C9BFA9" }}>رحلات مكتملة</p>
            <p className="text-lg font-bold text-white">{completedOrders.length}</p>
          </div>
        </div>
        {!online && (
          <div className="rounded-xl p-4 mb-5 text-center" style={{ background: `${CLAY}10`, border: `1px solid ${CLAY}40` }}>
            <p className="text-xs font-semibold" style={{ color: CLAY }}>أنت غير متصل — لن تصلك طلبات جديدة. فعّل الاتصال من الأعلى.</p>
          </div>
        )}
        {loading && <p className="text-center text-sm py-10" style={{ color: MUTED }}>جاري التحميل...</p>}

        {!loading && tab === "active" && (
          <div className="space-y-3">
            {available.length === 0 ? (
              <p className="text-center text-sm py-16" style={{ color: MUTED }}>ماكانش طلبات متاحة حالياً</p>
            ) : available.map((o) => (
              <OrderCard key={o.id} order={o} profiles={profiles} onAction={acceptOrder} actionLabel="قبول الطلب" subLabel="جاهز للاستلام من المورد" />
            ))}
          </div>
        )}
        {!loading && tab === "mine" && (
          <div className="space-y-3">
            {activeMyOrders.length === 0 ? (
              <p className="text-center text-sm py-16" style={{ color: MUTED }}>ماعندكش طلبات نشطة، شوف تبويب "طلبات متاحة"</p>
            ) : activeMyOrders.map((o) => (
              <OrderCard key={o.id} order={o} profiles={profiles} onAction={deliverOrder} actionLabel="تأكيد التسليم" />
            ))}
          </div>
        )}
        {!loading && tab === "history" && (
          <div className="space-y-2">
            {completedOrders.length === 0 && <p className="text-center text-sm py-16" style={{ color: MUTED }}>ماكانش رحلات مكتملة بعد</p>}
            {completedOrders.map((o) => (
              <div key={o.id} className="rounded-xl p-4 flex items-center justify-between" style={{ background: "#FFF", border: `1px solid ${BORDER}` }}>
                <div><p className="text-sm font-bold" style={{ color: INK }}>#{o.id.slice(0, 8)}</p><p className="text-xs" style={{ color: MUTED }}>{new Date(o.created_at).toLocaleDateString("ar-DZ")}</p></div>
                <span className="text-sm font-black" style={{ color: TEAL, fontFamily: "'Cairo', sans-serif" }}>{Number(o.total).toLocaleString()} د.ج</span>
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
  const [showLanding, setShowLanding] = useState(true);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { setUser(null); setShowLanding(true); };

  if (!user && showLanding) return <LandingPage onStart={() => setShowLanding(false)} />;
  if (!user) return <LoginScreen onLogin={handleLogin} onBack={() => setShowLanding(true)} />;
  if (user.role === "retail") return <RetailDashboard user={user} onLogout={handleLogout} />;
  if (user.role === "wholesale") return <WholesaleDashboard user={user} onLogout={handleLogout} />;
  if (user.role === "driver") return <DriverDashboard user={user} onLogout={handleLogout} />;
  return null;
}
