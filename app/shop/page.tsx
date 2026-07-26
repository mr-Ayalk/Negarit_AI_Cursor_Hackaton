"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ShopCheckout } from "@/components/ShopCheckout";
import { CafeSpotlight } from "@/components/CafeSpotlight";
import { ShopPayBrands, TelebirrLogo, ZemenLogo } from "@/components/BrandLogos";
import { PatternBackground } from "@/ui";
import { api, type ShopProduct } from "@/lib/api";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "clothing", label: "Clothing" },
  { id: "tools", label: "Tools" },
  { id: "accessories", label: "Accessories" },
  { id: "art", label: "Art" },
  { id: "souvenir", label: "Souvenirs" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function formatPrice(n: number) {
  return `${n.toLocaleString()} ETB`;
}

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<ShopProduct | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.products();
        if (alive) setProducts(res.products);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not load shop");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((p) => p.category === filter);
  }, [products, filter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: products.length };
    for (const p of products) map[p.category] = (map[p.category] || 0) + 1;
    return map;
  }, [products]);

  return (
    <div className="shop-page">
      <SiteHeader />

      <section className="hero-surface shop-hero">
        <PatternBackground variant="both" interactive fade />
        <div className="shop-hero__media">
          <Image
            src="/shop.jpg"
            alt="Zemen Gebeya — traditional Ethiopian clothing and crafts"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 40%" }}
          />
          <div className="shop-hero__veil" />
        </div>

        <div className="wrap shop-hero__content">
          <div className="reveal" style={{ marginBottom: "1rem" }}>
            <ZemenLogo size="lg" />
          </div>
          <p className="pill reveal reveal-delay-1" style={{ width: "fit-content", marginBottom: "0.85rem" }}>
            <span className="dot" />
            Adwa Museum · Official marketplace
          </p>
          <h1 className="reveal reveal-delay-1 shop-hero__title visually-hidden">Zemen Gebeya</h1>
          <p className="muted prose reveal reveal-delay-2 shop-hero__sub">
            Traditional Habesha clothing, highland tools, and museum crafts — pay securely with
            Telebirr.
          </p>
          <div className="row reveal reveal-delay-2" style={{ marginTop: "0.85rem", alignItems: "center" }}>
            <TelebirrLogo size="sm" />
            <span className="muted small">Accepted at checkout</span>
          </div>
          <div className="row reveal reveal-delay-3" style={{ marginTop: "1.4rem" }}>
            <a href="#catalog" className="btn btn-primary">
              Browse collection →
            </a>
            <Link href="/guide" className="btn btn-ghost">
              Back to guide
            </Link>
          </div>
        </div>
      </section>

      <section id="catalog" className="wrap shop-catalog">
        <CafeSpotlight />

        <div className="shop-catalog__head">
          <div>
            <h2 style={{ fontSize: "1.25rem", letterSpacing: "-0.04em" }}>Collection</h2>
            <p className="muted small">
              {loading ? "Loading…" : `${filtered.length} piece${filtered.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="shop-pay-badge shop-pay-badge--logos">
            <ShopPayBrands size="sm" />
          </div>
        </div>

        <div className="shop-filters" role="tablist" aria-label="Product categories">
          {FILTERS.map((f) => {
            const count = counts[f.id] ?? 0;
            if (f.id !== "all" && count === 0) return null;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={`shop-filter ${filter === f.id ? "is-active" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className="shop-filter__count">{f.id === "all" ? counts.all : count}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="small" style={{ color: "var(--accent)", marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        <div className="shop-grid">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shop-card shop-card--skeleton" aria-hidden />
            ))}

          {!loading &&
            filtered.map((product, i) => (
              <article
                key={product.id}
                className={`shop-card ${hovered === product.id ? "is-hot" : ""}`}
                style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
                onMouseEnter={() => setHovered(product.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <button
                  type="button"
                  className="shop-card__hit"
                  onClick={() => setSelected(product)}
                  aria-label={`Buy ${product.name}`}
                >
                  <div className="shop-card__media">
                    <Image
                      src={product.image || "/shop.jpg"}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      style={{
                        objectFit: "cover",
                        objectPosition: product.imageFocus || "center",
                        transform: hovered === product.id ? "scale(1.06)" : "scale(1)",
                      }}
                    />
                    <div className="shop-card__shine" />
                    {product.badge && <span className="shop-card__badge">{product.badge}</span>}
                  </div>
                  <div className="shop-card__body">
                    <p className="shop-card__cat">{product.category}</p>
                    <h3 className="shop-card__title">{product.name}</h3>
                    <p className="shop-card__am muted small">{product.nameAm}</p>
                    <div className="shop-card__foot">
                      <span className="shop-card__price">{formatPrice(product.priceETB)}</span>
                      <span className="shop-card__cta">Buy →</span>
                    </div>
                  </div>
                </button>
              </article>
            ))}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>
            No pieces in this category yet.
          </p>
        )}
      </section>

      <footer className="shop-foot wrap">
        <div className="shop-foot__brands">
          <ZemenLogo size="sm" />
          <TelebirrLogo size="sm" />
        </div>
        <p className="muted small">
          Curated for Adwa Museum visitors · payments via Negarit AI
        </p>
      </footer>

      <ShopCheckout product={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
