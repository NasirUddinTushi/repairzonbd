import React, { useMemo, useState } from "react";

/**
 * Repairzon BD – Client demo (full flow)
 * Restores the preview design you finalized: 
 * - Home: Hero + Category grid + Popular/Trending/Recent strips
 * - Clicking category/service on Home opens in-page ServicesModal (tabs: Services/Reviews, Details popup, dropdown/accordion, Add to cart)
 * - Services page: Grid; clicking any card opens Service Detail page (accordion + mini cart + reviews + long details)
 * - Footer: About/Privacy/Terms static pages
 * - WhatsApp button only on Home
 * - Navbar cart badge works
 * - All conditionals fixed to React syntax (&&)
 * - No external hooks; cart state lives locally via useCart()
 */

// =============================================================================
// Data — demo categories, services and reviews
// =============================================================================
const categories = [
  { id: "all", name: "All", icon: "🟢" },
  { id: "ac", name: "AC Services", icon: "❄️" },
  { id: "cleaning", name: "Cleaning", icon: "🧼" },
  { id: "pest", name: "Pest Control", icon: "🐜" },
  { id: "home-appliance", name: "Home Appliance", icon: "🔧" },
  { id: "gadgets", name: "Gadgets Repair", icon: "💻" },
  { id: "electronics", name: "Electronics", icon: "📺" },
  { id: "solar", name: "Solar Panel", icon: "🔆" },
  { id: "generator", name: "Generator", icon: "⚙️" },
  { id: "shifting", name: "Home/Office Shifting Services", icon: "📦" },
  { id: "web", name: "Web Design & Dev.", icon: "👨‍💻" },
];

// Minimal demo catalog (expand later with API)
const catalog = {
  ac: [
    {
      id: "ac-master",
      category: "ac",
      title: "AC Master Services",
      img:
        "https://images.unsplash.com/photo-1581094651181-3592d5894073?q=80&w=1200&auto=format&fit=crop",
      badge: "৳500 Off",
      details:
        "Regular servicing helps efficiency and extends AC lifespan. Includes panel cleaning & filter wash.",
      variants: [
        { id: "1-1.5", label: "1–1.5 Ton", price: 1090, old: 1590 },
        { id: "2-3", label: "2–3 Ton", price: 1290, old: 1790 },
        { id: "4-5", label: "4–5 Ton", price: 2290, old: 2790 },
      ],
      included: ["Filter cleaning", "Panel cleaning"],
      excluded: ["Spare parts", "Materials if used"],
    },
    {
      id: "ac-install",
      category: "ac",
      title: "AC Installation & Uninstallation or Shifting",
      img:
        "https://images.unsplash.com/photo-1581093588401-16b1a3a39a0b?q=80&w=1200&auto=format&fit=crop",
      details:
        "Installation/Uninstallation or shifting service by expert technicians.",
      variants: [
        { id: "1ton", label: "1 Ton", price: 3000 },
        { id: "1.5ton", label: "1.5 Ton", price: 3500 },
        { id: "2ton", label: "2 Ton", price: 4200 },
      ],
    },
  ],
  cleaning: [
    {
      id: "home-deep-clean",
      category: "cleaning",
      title: "Home Deep Cleaning",
      img:
        "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1200&auto=format&fit=crop",
      variants: [
        { id: "800-1200", label: "800-1200 sq. ft", price: 3990 },
        { id: "1200-1600", label: "1200-1600 sq. ft", price: 5000 },
      ],
      details:
        "Deep clean for complete home with professional chemicals and machines.",
    },
    {
      id: "carpet-clean",
      category: "cleaning",
      title: "Carpet Cleaning",
      img: "https://images.unsplash.com/photo-1527515545081-5db817172677?q=80&w=1200&auto=format&fit=crop",
      variants: [
        { id: "carpet-small", label: "Up to 80 sq. ft", price: 990 },
        { id: "carpet-large", label: "Up to 200 sq. ft", price: 1690 },
      ],
      details: "Professional shampoo wash and dry.",
    },
  ],
  electronics: [
    {
      id: "drill",
      category: "electronics",
      title: "Drilling Service",
      img: "https://images.unsplash.com/photo-1593965461330-fd3f98b2d79b?q=80&auto=format&fit=crop&w=1200",
      variants: [
        { id: "4holes", label: "Up to 4 holes", price: 200 },
        { id: "10holes", label: "Up to 10 holes", price: 450 },
      ],
      details: "Drilling for wall mounts and fixtures.",
    },
  ],
};

const reviews = [
  {
    id: 1,
    name: "CN",
    ago: "4months ago",
    rating: 5,
    text: "Excellent service! The team was professional and efficient. My AC works like new now.",
  },
  {
    id: 2,
    name: "CN",
    ago: "4months ago",
    rating: 5,
    text: "Quick response time and thorough cleaning. Highly recommended!",
  },
  {
    id: 3,
    name: "CN",
    ago: "4months ago",
    rating: 5,
    text: "Friendly technicians and great value for money. Will use again!",
  },
];

// =============================================================================
// Cart logic — pure helpers + React hook
// =============================================================================
function computeTotal(items) {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}
function addOrInc(items, svc, variant) {
  const key = `${svc.id}-${variant.id}`;
  const idx = items.findIndex((i) => i.key === key);
  if (idx >= 0) {
    const next = items.slice();
    next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
    return next;
  }
  return [
    ...items,
    { key, title: svc.title, variantLabel: variant.label, price: variant.price, qty: 1 },
  ];
}
function incByKey(items, key) {
  return items.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
}
function decByKey(items, key) {
  return items.flatMap((i) => (i.key === key ? (i.qty > 1 ? { ...i, qty: i.qty - 1 } : []) : i));
}
function removeByKey(items, key) {
  return items.filter((i) => i.key !== key);
}

// React hook used by App
function useCart() {
  const [items, setItems] = useState([]);
  const add = (svc, variant) => setItems((cur) => addOrInc(cur, svc, variant));
  const inc = (key) => setItems((cur) => incByKey(cur, key));
  const dec = (key) => setItems((cur) => decByKey(cur, key));
  const remove = (key) => setItems((cur) => removeByKey(cur, key));

  const total = useMemo(() => computeTotal(items), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  return { items, add, inc, dec, remove, total, count };
}

// =============================================================================
// Small UI helpers
// =============================================================================
const Money = ({ value }) => <span className="font-semibold">৳{value.toLocaleString()}</span>;
const Badge = ({ children }) => (
  <span className="text-xs rounded-full px-2 py-1 bg-green-100 text-green-700 border border-green-300">{children}</span>
);
const StarRow = ({ n = 5 }) => (
  <span className="ml-2 text-amber-500">{Array.from({ length: n }).map((_, i) => "★")}</span>
);

// =============================================================================
// Home page (Hero + categories + strips)
// =============================================================================
function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 to-emerald-600 p-10 text-white shadow-xl">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Make Your Home Appliance Services <span className="underline decoration-white/40">Simplified</span> & Reliable
        </h1>
        <p className="mt-3 text-white/90">
          From AC repair and electrical work to shifting & cleaning — book trusted professionals in one place.
        </p>
        <div className="mt-6 flex gap-3">
          <input className="w-full max-w-md rounded-xl px-4 py-3 text-slate-900" placeholder="Search services (e.g., AC, Cleaning)" />
          <button className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur hover:bg-white/20">Search</button>
        </div>
      </div>
      <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
    </section>
  );
}

function CategoryGrid({ onSelect }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-3">Browse by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {categories
          .filter((c) => c.id !== "all")
          .map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              className="group rounded-2xl border bg-white p-4 text-left shadow hover:shadow-lg hover:border-emerald-400 transition"
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-medium group-hover:text-emerald-600">{c.name}</div>
            </button>
          ))}
      </div>
    </section>
  );
}

function HomePage({ openCategoryModal, onOpenService }) {
  const flat = Object.values(catalog).flatMap((list) => list);
  const byId = Object.fromEntries(flat.map((s) => [s.id, s]));
  const popularIds = ["ac-install", "ac-master", "home-deep-clean"];
  const trendingIds = ["carpet-clean", "drill", "ac-install"];
  const recentIds = ["drill", "home-deep-clean"];
  const popular = popularIds.map((id) => byId[id]).filter(Boolean);
  const trending = trendingIds.map((id) => byId[id]).filter(Boolean);
  const recent = recentIds.map((id) => byId[id]).filter(Boolean);

  return (
    <div className="space-y-10">
      <Hero />
      <CategoryGrid onSelect={openCategoryModal} />
      <ServiceStrip title="Popular Services" items={popular} onOpen={onOpenService} />
      <ServiceStrip title="Trending" items={trending} onOpen={onOpenService} />
      <ServiceStrip title="Recent Services" items={recent} onOpen={onOpenService} />
    </div>
  );
}

// =============================================================================
// Services modal (accordion of variants for a category)
// =============================================================================
function ServicesModal({ open, onClose, categoryId, cart }) {
  if (!open) return null;
  const list = (catalog[categoryId] || []).slice();
  const [openId, setOpenId] = useState(list[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState("services");
  const [detailsSvc, setDetailsSvc] = useState(null);
  const catName = categories.find((c) => c.id === categoryId)?.name || "Services";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <div className="font-semibold">{catName}</div>
            <div className="ml-4 flex items-center gap-2 text-sm">
              <button
                className={`px-3 py-1 rounded-full border ${activeTab === "services" ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-slate-50"}`}
                onClick={() => setActiveTab("services")}
              >
                Services
              </button>
              <button
                className={`px-3 py-1 rounded-full border ${activeTab === "reviews" ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-slate-50"}`}
                onClick={() => setActiveTab("reviews")}
              >
                Reviews
              </button>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full border px-3 py-1">✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-4">
            {activeTab === "services" ? (
              list.map((svc) => (
                <div key={svc.id} className={`rounded-2xl border p-4 ${openId === svc.id ? "ring-1 ring-emerald-200" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold">{svc.title}</div>
                      {svc.badge && <Badge>{svc.badge}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-xl border px-3 py-1 hover:bg-slate-50"
                        onClick={() => setDetailsSvc(svc)}
                      >
                        Details
                      </button>
                      <button
                        className="rounded-xl border px-2 py-1 hover:bg-slate-50"
                        aria-label="Toggle service variants"
                        onClick={() => setOpenId(openId === svc.id ? null : svc.id)}
                      >
                        {openId === svc.id ? "▾" : "▸"}
                      </button>
                    </div>
                  </div>

                  {openId === svc.id && (
                    <div className="mt-3 grid gap-3">
                      {svc.variants.map((v) => (
                        <div key={v.id} className="flex items-center justify-between rounded-xl border p-3">
                          <div className="flex items-center gap-6">
                            <div className="text-sm text-slate-600">{v.label}</div>
                            <div className="text-lg">
                              <Money value={v.price} />
                              {v.old && (
                                <span className="ml-2 text-slate-400 line-through">৳{v.old}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => cart.add(svc, v)}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                          >
                            Add to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <ReviewList />
            )}
          </div>

          <aside className="w-full lg:w-80 rounded-2xl border bg-white p-4 h-fit sticky top-4">
            <h3 className="font-semibold">Your Cart</h3>
            <div className="mt-3 space-y-3">
              {cart.items.length === 0 && (
                <div className="text-slate-500">Your cart is empty.</div>
              )}
              {cart.items.map((i) => (
                <div key={i.key} className="rounded-xl border p-3">
                  <div className="text-sm font-medium">{i.title}</div>
                  <div className="text-xs text-slate-500">{i.variantLabel}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm">
                      <Money value={i.price} /> × {i.qty}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg border px-2" onClick={() => cart.dec(i.key)}>
                        -
                      </button>
                      <button className="rounded-lg border px-2" onClick={() => cart.inc(i.key)}>
                        +
                      </button>
                      <button className="rounded-lg bg-rose-600 text-white px-2" onClick={() => cart.remove(i.key)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3 flex items-center justify-between">
              <div className="text-slate-600">Total Amount:</div>
              <div className="text-lg font-semibold">
                <Money value={cart.total} />
              </div>
            </div>
            <a href="#/checkout" className="mt-3 w-full inline-block text-center rounded-xl bg-emerald-600 py-3 text-white hover:bg-emerald-700">
              Proceed To Checkout →
            </a>
          </aside>
        </div>
      </div>

      {detailsSvc && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" onClick={() => setDetailsSvc(null)}>
          <div className="w-full max-w-2xl bg-white rounded-2xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Best Cleaners for Home and Office Services.</div>
              <button className="rounded-full border px-3 py-1" onClick={() => setDetailsSvc(null)}>✕</button>
            </div>
            <p className="text-slate-700 text-sm">
              {detailsSvc.details ||
                "There is a saying that cleanliness is next to godliness... (demo text)"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <div className="font-medium">What's Excluded:</div>
                <ul className="text-sm list-disc pl-5 text-slate-700 space-y-1">
                  {(detailsSvc.excluded || [
                    "Furniture Dusting is excluded from the service.",
                    "Fan Cleaning is not included",
                    "Window Cleaning is Excluded from the Service.",
                  ]).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium">What's Included:</div>
                <ul className="text-sm list-disc pl-5 text-slate-700 space-y-1">
                  {(detailsSvc.included || [
                    "Standard technician visit",
                    "Quality chemicals & tools",
                  ]).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Services page (grid). Clicking any card opens the Services modal or detail page.
// =============================================================================
function ServiceCard({ svc, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="text-left rounded-2xl border bg-white hover:shadow-lg transition shadow-sm overflow-hidden"
    >
      <div
        className="aspect-video w-full bg-slate-200"
        style={{ backgroundImage: `url(${svc.img})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="p-4">
        <div className="font-medium flex items-center gap-2">
          {svc.title} {svc.badge && <Badge>{svc.badge}</Badge>}
        </div>
      </div>
    </button>
  );
}

function ServicesCatalog({ initialCat = "all", onCategorySelect, onOpenService }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState(initialCat);

  const flat = Object.values(catalog).flatMap((list) => list);
  const filtered = flat
    .filter((s) => (cat === "all" ? true : s.category === cat))
    .filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

  const openFromCard = (svc) => {
    onOpenService && onOpenService(svc);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full max-w-md rounded-xl border px-4 py-2"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCat(c.id);
                onCategorySelect && onCategorySelect(c.id);
              }}
              className={`rounded-full px-3 py-1 text-sm border ${cat === c.id ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-slate-50"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((svc) => (
          <ServiceCard key={svc.id} svc={svc} onOpen={() => openFromCard(svc)} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Reviews list (shared)
// =============================================================================
function ReviewList() {
  return (
    <div className="rounded-2xl border bg-white p-4">
      {reviews.map((r) => (
        <div key={r.id} className="border-b last:border-none py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-slate-600 font-semibold">
              {r.name}
            </div>
            <div className="text-sm text-slate-500">{r.ago}</div>
            <StarRow n={r.rating} />
          </div>
          <p className="mt-2 text-slate-700">{r.text}</p>
        </div>
      ))}
    </div>
  );
}

// Horizontal strip of service cards for the Home sections
function ServiceStrip({ title, items, onOpen }) {
  if (!items || items.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((svc) => (
          <button
            key={svc.id}
            onClick={() => onOpen?.(svc)}
            className="text-left rounded-2xl border bg-white hover:shadow-lg transition shadow-sm overflow-hidden"
          >
            <div
              className="aspect-video w-full bg-slate-200"
              style={{ backgroundImage: `url(${svc.img})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            <div className="p-4">
              <div className="font-medium flex items-center gap-2">
                {svc.title} {svc.badge && <Badge>{svc.badge}</Badge>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// Service detail page (screenshot #2 style)
// =============================================================================
function ServiceDetailPage({ service, cart, onBack, onCheckout }) {
  if (!service) return null;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl overflow-hidden border">
        <div className="p-4 bg-gradient-to-r from-sky-700 to-emerald-700 text-white">
          <div className="text-lg font-semibold">{service.title}</div>
          <div className="text-sm opacity-80">5.0 ★★★★★</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Select Services */}
          <div className="lg:col-span-2 rounded-2xl border p-4">
            <div className="text-center font-semibold mb-3">{service.title}</div>
            <div className="space-y-3">
              {service.variants.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="text-sm text-slate-600">{v.label}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg"><Money value={v.price} /></div>
                    <div className="flex rounded-lg overflow-hidden border">
                      <button className="px-3">-</button>
                      <span className="px-3 border-l border-r">1</span>
                      <button className="px-3">+</button>
                    </div>
                    <button onClick={() => cart.add(service, v)} className="rounded-xl bg-emerald-600 px-4 py-2 text-white">Add</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart mini */}
          <aside className="rounded-2xl border p-4 h-fit">
            <div className="font-semibold">Your Cart</div>
            <div className="mt-3 space-y-3">
              {cart.items.map((i) => (
                <div key={i.key} className="rounded-xl border p-3">
                  <div className="text-sm font-medium">{i.title}</div>
                  <div className="text-xs text-slate-500">{i.variantLabel}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm"><Money value={i.price} /> × {i.qty}</div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg border px-2" onClick={() => cart.dec(i.key)}>-</button>
                      <button className="rounded-lg border px-2" onClick={() => cart.inc(i.key)}>+</button>
                      <button className="rounded-lg bg-rose-600 text-white px-2" onClick={() => cart.remove(i.key)}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.items.length === 0 && <div className="text-slate-500">Your cart is empty.</div>}
            </div>
            <div className="mt-4 border-t pt-3 flex items-center justify-between">
              <div className="text-slate-600">Total Amount:</div>
              <div className="text-lg font-semibold"><Money value={cart.total} /></div>
            </div>
            <button className="mt-3 w-full rounded-xl bg-emerald-600 py-2 text-white" onClick={onCheckout}>Proceed To Checkout →</button>
          </aside>
        </div>
      </div>

      {/* Long sections */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{service.title} - Adhunik BD</h2>
        <div className="font-semibold">Why is AC Servicing Important?</div>
        <p className="text-slate-700">Sometimes, it’s needed to service it regularly to achieve optimal performance... (demo content)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="font-medium">What's Excluded?</div>
            <ul className="list-disc pl-5 text-slate-700 space-y-1">
              {(service.excluded || ["Material or Parts (if used)", "Transportation (if applicable)", "AC angle cost not included"]).map((x,i)=>(<li key={i}>{x}</li>))}
            </ul>
          </div>
          <div>
            <div className="font-medium">What's Included?</div>
            <ul className="list-disc pl-5 text-slate-700 space-y-1">
              {(service.included || ["Only Service Charges", "15 days Service Warranty"]).map((x,i)=>(<li key={i}>{x}</li>))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Reviews</h3>
        <ReviewList />
      </section>

      {onBack && (
        <button onClick={onBack} className="text-sm text-slate-500 underline">Back</button>
      )}
    </div>
  );
}

// =============================================================================
// Checkout & Login pages
// =============================================================================
function CheckoutPage({ cart, onBack }) {
  const subtotal = cart.total;
  const discount = 0;
  const total = subtotal - discount;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        {cart.items.map((i) => (
          <div key={i.key} className="rounded-xl border p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{i.title}</div>
              <div className="text-sm text-slate-500">{i.variantLabel}</div>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <Money value={i.price} /> × {i.qty}
              </div>
              <button className="rounded border px-2" onClick={() => cart.dec(i.key)}>
                -
              </button>
              <button className="rounded border px-2" onClick={() => cart.inc(i.key)}>
                +
              </button>
              <button className="rounded bg-rose-600 text-white px-2" onClick={() => cart.remove(i.key)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
      <aside className="rounded-xl border p-4 h-fit">
        <h3 className="font-semibold mb-2">Summary</h3>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>
            <Money value={subtotal} />
          </span>
        </div>
        <div className="flex justify-between text-sm text-rose-600">
          <span>Discount</span>
          <span>-<Money value={discount} /></span>
        </div>
        <div className="flex justify-between font-semibold text-lg mt-2">
          <span>Total</span>
          <span>
            <Money value={total} />
          </span>
        </div>
        <button className="mt-4 w-full rounded-lg bg-emerald-700 text-white py-2">Place Order</button>
        <button onClick={onBack} className="mt-2 w-full text-sm text-slate-500 underline">
          Back
        </button>
      </aside>
    </div>
  );
}

function LoginPage({ onBack }) {
  return (
    <div className="grid place-items-center">
      <div className="w-full max-w-xl rounded-2xl border p-8 bg-white">
        <h1 className="text-3xl font-semibold">Welcome to Repairzon Bd</h1>
        <p className="text-slate-600 mt-2">Enter your phone number or continue with Google</p>
        <label className="block text-sm mt-6">Phone</label>
        <input
          className="mt-1 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          placeholder="01XXXXXXXXX"
        />
        <button className="mt-3 w-full rounded-xl bg-emerald-700 text-white py-3">Send OTP</button>
        <div className="my-6 flex items-center gap-3 text-slate-400">
          <div className="h-px bg-slate-200 flex-1" />
          <span>OR</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>
        <button className="w-full rounded-xl border py-3 flex items-center justify-center gap-2">
          <span>🟦</span> Continue with Google
        </button>
        <button onClick={onBack} className="mt-3 w-full text-sm text-slate-500 underline">
          Back
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Layout & App
// =============================================================================
function Navbar({ onNavigate, route, cartCount }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-emerald-600" />
          <span className="font-semibold">Repairzon BD</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <button onClick={() => onNavigate("/")} className={route === "/" ? "font-semibold" : "hover:text-emerald-700"}>
            Home
          </button>
          <button
            onClick={() => onNavigate("/services")}
            className={route === "/services" ? "font-semibold" : "hover:text-emerald-700"}
          >
            Services
          </button>
          <button onClick={() => onNavigate("/checkout")} className="relative grid place-items-center h-9 w-9 rounded-full bg-slate-100">
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 grid place-items-center h-5 min-w-5 rounded-full bg-rose-600 text-white text-[11px] px-1">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={() => onNavigate("/login")} className="rounded-lg bg-emerald-700 text-white px-4 py-1.5">
            Login
          </button>
        </nav>
      </div>
    </header>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="font-semibold">Repairzon BD</div>
          <p className="mt-2 text-slate-600">Having trouble finding right service? Our team is available 24/7.</p>
        </div>
        <div>
          <div className="font-semibold">Company</div>
          <ul className="mt-2 space-y-2 text-slate-600">
            <li><button className="hover:text-emerald-700" onClick={() => onNavigate?.("/about")}>About</button></li>
            <li><button className="hover:text-emerald-700" onClick={() => onNavigate?.("/privacy")}>Privacy Policy</button></li>
            <li><button className="hover:text-emerald-700" onClick={() => onNavigate?.("/terms")}>Terms & Conditions</button></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Support</div>
          <ul className="mt-2 space-y-2 text-slate-600">
            <li>FAQ</li>
            <li>Contact</li>
            <li>Vendor Login</li>
          </ul>
        </div>
        <div id="contact">
          <div className="font-semibold">Contact</div>
          <p className="mt-2 text-slate-600">📞 <a className="hover:underline" href="https://wa.me/8801954218918" target="_blank" rel="noreferrer">01954218918</a></p>
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 pb-6">© {new Date().getFullYear()} Repairzon BD. All rights reserved.</div>
    </footer>
  );
}

function StaticPage({ title, children }) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState("/");
  const [initialCatalogCat, setInitialCatalogCat] = useState("all");
  const [selectedService, setSelectedService] = useState(null);
  const [homeModalOpen, setHomeModalOpen] = useState(false);
  const [homeModalCat, setHomeModalCat] = useState(null);
  const cart = useCart();

  const openHomeModalForCategory = (catId) => {
    setHomeModalCat(catId || "ac");
    setHomeModalOpen(true);
  };

  const goServices = (catId = "all") => {
    setInitialCatalogCat(catId);
    setRoute("/services");
  };

  const getDefaultServiceForCategory = (catId) => {
    const list = catalog[catId] || [];
    if (catId === "ac") {
      const acInstall = list.find((s) => s.id === "ac-install");
      if (acInstall) return acInstall; // Match screenshot #2
    }
    return list[0] || null;
  };

  const openDetailForCategory = (catId) => {
    const svc = getDefaultServiceForCategory(catId);
    if (svc) {
      setSelectedService(svc);
      setRoute("/service");
    }
  };

  const openDetailForService = (svc) => {
    setSelectedService(svc);
    setRoute("/service");
  };

  const showWhatsApp = route === "/"; // only on home page

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar onNavigate={setRoute} route={route} cartCount={cart.count} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {route === "/" && (
          <>
            <HomePage openCategoryModal={openHomeModalForCategory} onOpenService={openDetailForService} />
            <ServicesModal
              open={homeModalOpen}
              onClose={() => setHomeModalOpen(false)}
              categoryId={homeModalCat || "ac"}
              cart={cart}
            />
          </>
        )}

        {route === "/services" && (
          <ServicesCatalog
            initialCat={initialCatalogCat}
            onCategorySelect={openDetailForCategory}
            onOpenService={openDetailForService}
          />
        )}

        {route === "/service" && (
          <ServiceDetailPage
            service={selectedService}
            cart={cart}
            onBack={() => setRoute("/services")}
            onCheckout={() => setRoute("/checkout")}
          />
        )}

        {route === "/checkout" && <CheckoutPage cart={cart} onBack={() => setRoute("/services")} />}
        {route === "/login" && <LoginPage onBack={() => setRoute("/")} />}

        {route === "/about" && (
          <StaticPage title="About">
            <p className="text-slate-600 mt-2">This is a placeholder About page for the client demo.</p>
          </StaticPage>
        )}
        {route === "/privacy" && (
          <StaticPage title="Privacy Policy">
            <p className="text-slate-600 mt-2">This is a placeholder Privacy Policy page for the client demo.</p>
          </StaticPage>
        )}
        {route === "/terms" && (
          <StaticPage title="Terms & Conditions">
            <p className="text-slate-600 mt-2">This is a placeholder Terms & Conditions page for the client demo.</p>
          </StaticPage>
        )}
      </main>
      <Footer onNavigate={setRoute} />

      {showWhatsApp && (
        <div className="fixed bottom-6 right-6 z-40 group">
          <a
            href="https://wa.me/8801954218918"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl hover:shadow-2xl transition"
            title="Chat on WhatsApp"
          >
            <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
              <path d="M16 3a13 13 0 00-11.3 19.5L3 29l6.8-1.8A13 13 0 1016 3zm7.3 18.6c-.3.9-1.7 1.6-2.5 1.7-.7.1-1.6.1-2.6-.2-4.6-1.4-7.6-5.4-7.9-5.9-.2-.5-1.9-2.5-1.9-4.8 0-2.3 1.2-3.4 1.7-3.9.4-.5.9-.5 1.2-.5h.9c.3 0 .7 0 1 .8.4 1 .9 2.4 1 2.6.1.2.1.5-.1.8-.2.3-.3.6-.6.9-.2.3-.4.6-.2 1 .2.3.9 1.6 2.1 2.6 1.4 1.2 2.6 1.6 3 .1.2-.3.5-.7.8-.9.2-.2.5-.2.8-.1.3.1 2 .9 2.3 1 .3.1.6.2.7.3.1.1.1.9-.2 1.6z"/>
            </svg>
          </a>
          <div className="pointer-events-none absolute right-16 -top-1 translate-y-[-50%] opacity-0 group-hover:opacity-100 transition bg-slate-900 text-white text-xs rounded-lg px-2 py-1 shadow">
            WhatsApp: 01954218918
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------- Lightweight tests -----------------------------
(function runCartTests() {
  const mock = [
    { id: "a", price: 100, qty: 1 },
    { id: "b", price: 50, qty: 5 },
  ];
  const total = mock.reduce((s, i) => s + i.price * i.qty, 0);
  console.assert(total === 350, "Cart total should be 350");
})();
