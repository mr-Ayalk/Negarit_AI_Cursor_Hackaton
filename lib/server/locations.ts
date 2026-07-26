import type { MuseumLocation } from "@/lib/api";

/**
 * Adwa Museum WiFi zone map.
 * Each hall has an SSID. Replace with real museum AP names when installed.
 */

export type CoffeePlace = {
  id: string;
  name: string;
  nameAm: string;
  distance: string;
  specialty: string;
  priceRange: string;
  openUntil: string;
  nearLocationId: string;
  reason: string;
  /** Neighborhood / landmark label */
  area?: string;
  areaAm?: string;
  image?: string;
  featured?: boolean;
};

export type ProductCategory =
  | "clothing"
  | "tools"
  | "accessories"
  | "art"
  | "souvenir";

export type Product = {
  id: string;
  name: string;
  nameAm: string;
  description: string;
  priceETB: number;
  category: ProductCategory;
  locationId?: string;
  image: string;
  /** CSS object-position — crop variety from shared shop photo */
  imageFocus?: string;
  badge?: string;
};

export const locations: MuseumLocation[] = [
  {
    id: "gateway",
    name: "Museum Gateway",
    nameAm: "የሙዚየም መግቢያ",
    beaconId: "negarit-gateway",
    beaconName: "Negarit-Gateway",
    order: 0,
    type: "entrance",
    coordinates: { x: 50, y: 92 },
    welcome: true,
    narrative: {
      en: "You stand at the threshold of Adwa Museum — a living memory of Ethiopia's victory of 1896. The drums of Negarit once summoned warriors across the highlands. Today, I am your Negarit — your guide through courage, empire, and home.",
      am: "እርስዎ በአድዋ ሙዚየም መግቢያ ላይ ነዎት — የ1896 ዓ.ም የኢትዮጵያ ድል ትዝታ። የነጋሪት ከበሮዎች ጦረኞችን ይጠሩ ነበር። ዛሬ እኔ የእርስዎ ነጋሪት ነኝ።",
    },
    guideScript: {
      en: "Hello! Welcome to Adwa Museum. From now on, I will guide you through every hall. Stay on museum WiFi and walk freely — I will speak when you enter a new place.",
      am: "ሰላም! ወደ አድዋ ሙዚየም እንኳን በደህና መጡ። ከአሁን ጀምሮ በእያንዳንዱ አዳራሽ እመራዎታለሁ።",
    },
    ads: [],
    amenities: [],
  },
  {
    id: "5gna-ber",
    name: "5gna Ber",
    nameAm: "፭ኛ በር",
    beaconId: "negarit-5gna-ber",
    beaconName: "Negarit-5gna-Ber",
    order: 1,
    type: "hall",
    coordinates: { x: 28, y: 70 },
    welcome: false,
    narrative: {
      en: "5gna Ber — the Fifth Gate. Here the stories of warrior units gather: shields of hide, spears of iron, and banners that flew above Menelik's armies.",
      am: "፭ኛ በር — የጦረኞች ታሪክ የሚሰበሰብበት በር። ጋሻዎች፣ ጦሮች እና የምኒሊክ ሠራዊት ባንዲራዎች።",
    },
    guideScript: {
      en: "You have entered 5gna Ber. Look to your left — warrior regalia from the Battle of Adwa. Each shield tells a house's honor.",
      am: "ወደ ፭ኛ በር ገብተዋል። ወደ ግራ ይመልከቱ — የአድዋ ጦርነት የጦረኞች ልብስ።",
    },
    stories: [
      {
        id: "warriors-of-shewa",
        title: "Warriors of Shewa",
        body: "Shewan fighters carried layered hide shields and short spears suited to mountain combat.",
      },
      {
        id: "women-of-adwa",
        title: "Women of Adwa",
        body: "Women supplied food, water, and intelligence along the campaign trail.",
      },
    ],
    ads: [
      {
        id: "ad-warrior-cloak",
        productId: "prod-warrior-cloak",
        title: "Replica Warrior Cloak",
        subtitle: "Museum craft collection",
        image: "/shop.jpg",
        priceETB: 2500,
        cta: "Pay with Chapa",
      },
      {
        id: "ad-shield-print",
        productId: "prod-shield-print",
        title: "Shield Art Print",
        subtitle: "Limited Adwa series",
        image: "/shop.jpg",
        priceETB: 850,
        cta: "Pay with Chapa",
      },
    ],
    amenities: ["restroom-near", "water-fountain"],
  },
  {
    id: "6gna-ber",
    name: "6gna Ber",
    nameAm: "፮ኛ በር",
    beaconId: "negarit-6gna-ber",
    beaconName: "Negarit-6gna-Ber",
    order: 2,
    type: "hall",
    coordinates: { x: 72, y: 68 },
    welcome: false,
    narrative: {
      en: "6gna Ber — the Sixth Gate. Maps, treaties, and the diplomacy of victory.",
      am: "፮ኛ በር — ካርታዎች፣ ስምምነቶች እና የድል ዲፕሎማሲ።",
    },
    guideScript: {
      en: "Welcome to 6gna Ber. Study the campaign map on the central wall — routes from Entoto to Adwa.",
      am: "ወደ ፮ኛ በር እንኳን በደህና መጡ። የጦር ካርታውን ይመልከቱ።",
    },
    stories: [
      {
        id: "treaty-and-truth",
        title: "Treaty and Truth",
        body: "The contested Treaty of Wuchale became a spark. Ethiopia rejected foreign guardianship — and Adwa sealed that refusal.",
      },
    ],
    ads: [
      {
        id: "ad-map-scroll",
        productId: "prod-map-scroll",
        title: "Adwa Campaign Map Scroll",
        subtitle: "Hand-finished parchment style",
        image: "/shop.jpg",
        priceETB: 1200,
        cta: "Pay with Chapa",
      },
    ],
    amenities: [],
  },
  {
    id: "emperor-hall",
    name: "Emperor Menelik Hall",
    nameAm: "የንጉሠ ነገሥት ምኒሊክ አዳራሽ",
    beaconId: "negarit-emperor-hall",
    beaconName: "Negarit-Emperor-Hall",
    order: 3,
    type: "hall",
    coordinates: { x: 50, y: 45 },
    welcome: false,
    narrative: {
      en: "Emperor Menelik Hall. Crowns, correspondence, and the quiet weight of leadership. Empress Taytu's resolve stands beside the Emperor's command.",
      am: "የንጉሠ ነገሥት ምኒሊክ አዳራሽ — ዘውዶች፣ ደብዳቤዎች እና የመሪነት ክብደት።",
    },
    guideScript: {
      en: "You are in Emperor Menelik Hall. Notice Empress Taytu's influence in the letters displayed.",
      am: "በንጉሠ ነገሥት ምኒሊክ አዳራሽ ነዎት። የእቴጌ ጣይቱን ተጽዕኖ ይመልከቱ።",
    },
    stories: [
      {
        id: "taytu-resolve",
        title: "Empress Taytu's Resolve",
        body: "Taytu refused to surrender Ethiopian land and urged firm resistance.",
      },
    ],
    ads: [
      {
        id: "ad-taytu-scarf",
        productId: "prod-taytu-scarf",
        title: "Taytu Heritage Scarf",
        subtitle: "Woven motif collection",
        image: "/shop.jpg",
        priceETB: 1800,
        cta: "Pay with Chapa",
      },
    ],
    amenities: ["seating"],
  },
  {
    id: "victory-court",
    name: "Victory Court",
    nameAm: "የድል አደባባይ",
    beaconId: "negarit-victory-court",
    beaconName: "Negarit-Victory-Court",
    order: 4,
    type: "courtyard",
    coordinates: { x: 50, y: 22 },
    welcome: false,
    narrative: {
      en: "Victory Court — open sky above stone that remembers cheering crowds.",
      am: "የድል አደባባይ — ሰማይ እና የድል ትውስታ።",
    },
    guideScript: {
      en: "You have reached Victory Court. When you are ready, I can write your full visit story.",
      am: "ወደ የድል አደባባይ ደርሰዋል። ዝግጁ ሲሆኑ የጉብኝት ታሪክዎን እጽፍልዎታለሁ።",
    },
    stories: [
      {
        id: "echoes-of-victory",
        title: "Echoes of Victory",
        body: "March 1, 1896. Ethiopia's triumph became a global signal that African sovereignty could stand against empire.",
      },
    ],
    ads: [
      {
        id: "ad-victory-medal",
        productId: "prod-victory-medal",
        title: "Commemorative Victory Medal",
        subtitle: "Museum exclusive",
        image: "/shop.jpg",
        priceETB: 950,
        cta: "Buy with Chapa",
      },
      {
        id: "ad-mesob",
        productId: "prod-mesob-basket",
        title: "Mesob — Woven Food Basket",
        subtitle: "Traditional craft · Zemen Gebeya",
        image: "/shop.jpg",
        priceETB: 2200,
        cta: "Buy with Chapa",
      },
      {
        id: "ad-jebena",
        productId: "prod-jebena-set",
        title: "Jebena Coffee Pot",
        subtitle: "Highland tool · Zemen Gebeya",
        image: "/shop.jpg",
        priceETB: 950,
        cta: "Pay with Chapa",
      },
    ],
    amenities: ["cafe-nearby", "gift-shop"],
  },
];

export const coffeePlaces: CoffeePlace[] = [
  {
    id: "mekonen-baklava",
    name: "Mekonen Baklava",
    nameAm: "መኮንን ባቅላባ",
    distance: "Piazza · short ride from Adwa Museum",
    specialty: "Baklava, coffee & pastry",
    priceRange: "80–250 ETB",
    openUntil: "21:00",
    nearLocationId: "gateway",
    area: "Piazza",
    areaAm: "ፒያሳ",
    image: "/baklava.jpg",
    featured: true,
    reason:
      "Partner cafe at Piazza — fresh baklava and coffee when you need a sweet pause from the halls.",
  },
  {
    id: "bunna-house",
    name: "Bunna House Café",
    nameAm: "ቡና ሃውስ ካፌ",
    distance: "Inside museum · 2 min walk",
    specialty: "Traditional coffee ceremony",
    priceRange: "80–150 ETB",
    openUntil: "18:00",
    nearLocationId: "emperor-hall",
    area: "Adwa Museum",
    reason: "Quiet seating and a full coffee ceremony — perfect midway refreshment.",
  },
  {
    id: "adwa-terrace",
    name: "Adwa Terrace",
    nameAm: "አድዋ ቴራስ",
    distance: "Victory Court · 1 min walk",
    specialty: "Espresso & soft drinks",
    priceRange: "60–120 ETB",
    openUntil: "19:00",
    nearLocationId: "victory-court",
    area: "Victory Court",
    reason: "Open-air terrace with museum views.",
  },
  {
    id: "highland-sip",
    name: "Highland Sip",
    nameAm: "ሃይላንድ ሲፕ",
    distance: "Near 5gna Ber · 3 min walk",
    specialty: "Herbal tea & snacks",
    priceRange: "50–100 ETB",
    openUntil: "17:30",
    nearLocationId: "5gna-ber",
    area: "5gna Ber",
    reason: "Light snacks and cool drinks when energy dips.",
  },
];

export const products: Product[] = [
  {
    id: "prod-habesha-kemis-tilet",
    name: "Habesha Kemis — Gold Tilet",
    nameAm: "ሐበሻ ቀሚስ — ወርቃማ ጥልፍ",
    description:
      "Handwoven white cotton dress with intricate gold and brown tilet embroidery. Classic highland formal wear.",
    priceETB: 6800,
    category: "clothing",
    locationId: "emperor-hall",
    image: "/shop.jpg",
    imageFocus: "12% 35%",
    badge: "Bestseller",
  },
  {
    id: "prod-habesha-kemis-red",
    name: "Habesha Kemis — Crimson Border",
    nameAm: "ሐበሻ ቀሚስ — ቀይ ጥልፍ",
    description:
      "Elegant kemis with deep red tilet borders. Tailored for ceremonies and museum evenings.",
    priceETB: 7200,
    category: "clothing",
    locationId: "emperor-hall",
    image: "/shop.jpg",
    imageFocus: "18% 42%",
  },
  {
    id: "prod-netela-shawl",
    name: "Netela Shawl — Striped Weave",
    nameAm: "ነጠላ ሻውል",
    description:
      "Lightweight handwoven netela with traditional multi-color stripes. Wear over kemis or alone.",
    priceETB: 1850,
    category: "clothing",
    locationId: "5gna-ber",
    image: "/shop.jpg",
    imageFocus: "55% 55%",
    badge: "Handwoven",
  },
  {
    id: "prod-warrior-cloak",
    name: "Replica Warrior Cloak",
    nameAm: "የጦረኛ ካባ",
    description: "Handcrafted cloak inspired by Adwa-era warrior attire.",
    priceETB: 2500,
    category: "clothing",
    locationId: "5gna-ber",
    image: "/shop.jpg",
    imageFocus: "28% 30%",
  },
  {
    id: "prod-taytu-scarf",
    name: "Taytu Heritage Scarf",
    nameAm: "የጣይቱ ሻርብ",
    description: "Soft woven scarf with Empress Taytu inspired patterns.",
    priceETB: 1800,
    category: "clothing",
    locationId: "emperor-hall",
    image: "/shop.jpg",
    imageFocus: "70% 45%",
  },
  {
    id: "prod-mesob-basket",
    name: "Mesob — Woven Food Basket",
    nameAm: "መሶብ",
    description:
      "Traditional coiled-grass mesob. Iconic Ethiopian table centerpiece for injera and feast.",
    priceETB: 2200,
    category: "tools",
    locationId: "victory-court",
    image: "/shop.jpg",
    imageFocus: "8% 78%",
    badge: "Craft",
  },
  {
    id: "prod-jebena-set",
    name: "Jebena Coffee Pot",
    nameAm: "ጀበና",
    description:
      "Clay jebena for authentic buna ceremony. Heat-ready, museum artisan glaze.",
    priceETB: 950,
    category: "tools",
    locationId: "victory-court",
    image: "/shop.jpg",
    imageFocus: "88% 48%",
  },
  {
    id: "prod-berchuma-stand",
    name: "Three-Leg Wooden Stand",
    nameAm: "ባርቹማ መቆሚያ",
    description:
      "Carved three-leg traditional stand — used for serving trays, mesob, and household tools.",
    priceETB: 1400,
    category: "tools",
    locationId: "6gna-ber",
    image: "/shop.jpg",
    imageFocus: "42% 88%",
  },
  {
    id: "prod-rekebot-tray",
    name: "Rekebot Coffee Tray",
    nameAm: "ረከቦት",
    description:
      "Wooden coffee ceremony tray with cup wells. Pair with jebena for a complete buna set.",
    priceETB: 1100,
    category: "tools",
    locationId: "victory-court",
    image: "/shop.jpg",
    imageFocus: "75% 70%",
  },
  {
    id: "prod-woven-tote",
    name: "Striped Woven Tote",
    nameAm: "ባለፈትል ቦርሳ",
    description: "Handwoven tote with highland color bands. Day bag for the museum circuit.",
    priceETB: 1600,
    category: "accessories",
    locationId: "gateway",
    image: "/shop.jpg",
    imageFocus: "48% 52%",
  },
  {
    id: "prod-leather-satchel",
    name: "Highland Leather Satchel",
    nameAm: "የቆዳ ቦርሳ",
    description: "Soft leather satchel with brass clasp. Modern cut, traditional finish.",
    priceETB: 3200,
    category: "accessories",
    locationId: "gateway",
    image: "/shop.jpg",
    imageFocus: "62% 58%",
    badge: "New",
  },
  {
    id: "prod-coptic-cross",
    name: "Hand Cross — Coptic Style",
    nameAm: "የእጅ መስቀል",
    description: "Ornate processional-style hand cross. Cast metal with highland motif.",
    priceETB: 2800,
    category: "accessories",
    locationId: "emperor-hall",
    image: "/shop.jpg",
    imageFocus: "58% 62%",
  },
  {
    id: "prod-filigree-bracelet",
    name: "Gold-Tone Filigree Bracelet",
    nameAm: "የወርቅ አምባር",
    description: "Filigree bracelet inspired by historic Ethiopian court jewelry.",
    priceETB: 1950,
    category: "accessories",
    locationId: "emperor-hall",
    image: "/shop.jpg",
    imageFocus: "52% 48%",
  },
  {
    id: "prod-coffee-art",
    name: "Coffee Ceremony Painting",
    nameAm: "የቡና ሥነ ሥርዓት ሥዕል",
    description:
      "Vibrant canvas of a woman in traditional dress preparing buna. Gallery wrap.",
    priceETB: 4500,
    category: "art",
    locationId: "victory-court",
    image: "/shop.jpg",
    imageFocus: "35% 85%",
  },
  {
    id: "prod-shield-print",
    name: "Shield Art Print",
    nameAm: "የጋሻ ህትመት",
    description: "Museum-quality print of a traditional highland shield motif.",
    priceETB: 850,
    category: "art",
    locationId: "5gna-ber",
    image: "/shop.jpg",
    imageFocus: "80% 20%",
  },
  {
    id: "prod-map-scroll",
    name: "Adwa Campaign Map Scroll",
    nameAm: "የአድዋ ካርታ",
    description: "Decorative scroll of the 1896 campaign routes.",
    priceETB: 1200,
    category: "souvenir",
    locationId: "6gna-ber",
    image: "/shop.jpg",
    imageFocus: "90% 30%",
  },
  {
    id: "prod-victory-medal",
    name: "Commemorative Victory Medal",
    nameAm: "የድል ሜዳልያ",
    description: "Limited museum medal commemorating the Battle of Adwa.",
    priceETB: 950,
    category: "souvenir",
    locationId: "victory-court",
    image: "/shop.jpg",
    imageFocus: "95% 15%",
  },
];

export function getLocationByBeacon(beaconIdOrName: string) {
  const raw = String(beaconIdOrName || "").trim();
  const key = raw.toLowerCase();

  // Live museum SSIDs → hall ids
  const ssidMap: Record<string, string> = {
    "adwa-staff": "gateway",
    "adwa-museum-gateway": "gateway",
    "negarit-gateway": "gateway",
    "adwa-5gna-ber": "5gna-ber",
    "negarit-5gna-ber": "5gna-ber",
    "adwa-6gna-ber": "6gna-ber",
    "negarit-6gna-ber": "6gna-ber",
    "adwa-emperor-hall": "emperor-hall",
    "negarit-emperor-hall": "emperor-hall",
    "adwa-victory-court": "victory-court",
    "negarit-victory-court": "victory-court",
  };
  const mappedId = ssidMap[key];
  if (mappedId) {
    const mapped = locations.find((l) => l.id === mappedId);
    if (mapped) return mapped;
  }

  return locations.find(
    (l) =>
      l.beaconId.toLowerCase() === key ||
      l.beaconName.toLowerCase() === key ||
      l.id.toLowerCase() === key ||
      key.includes(l.id.toLowerCase()) ||
      `adwa-${l.id}`.includes(key) ||
      key.includes(`adwa-${l.id}`)
  );
}

export const getLocationByWifi = getLocationByBeacon;

export function getLocationById(id: string) {
  return locations.find((l) => l.id === id);
}
