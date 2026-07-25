import type { MuseumLocation } from "@/lib/api";

/**
 * Adwa Museum Bluetooth beacon map.
 * Replace beaconId values with real beacon MAC/UUID when hardware is available.
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
};

export type Product = {
  id: string;
  name: string;
  description: string;
  priceETB: number;
  category: string;
  locationId: string;
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
      en: "Hello! Welcome to Adwa Museum. From now on, I will guide you through every hall. Keep Bluetooth on and walk freely — I will speak when you enter a new place.",
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
        image: "/ads/warrior-cloak.jpg",
        priceETB: 2500,
        cta: "Buy with Telebirr",
      },
      {
        id: "ad-shield-print",
        productId: "prod-shield-print",
        title: "Shield Art Print",
        subtitle: "Limited Adwa series",
        image: "/ads/shield-print.jpg",
        priceETB: 850,
        cta: "Buy with Telebirr",
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
        image: "/ads/map-scroll.jpg",
        priceETB: 1200,
        cta: "Buy with Telebirr",
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
        image: "/ads/taytu-scarf.jpg",
        priceETB: 1800,
        cta: "Buy with Telebirr",
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
        image: "/ads/victory-medal.jpg",
        priceETB: 950,
        cta: "Buy with Telebirr",
      },
    ],
    amenities: ["cafe-nearby", "gift-shop"],
  },
];

export const coffeePlaces: CoffeePlace[] = [
  {
    id: "bunna-house",
    name: "Bunna House Café",
    nameAm: "ቡና ሃውስ ካፌ",
    distance: "Inside museum · 2 min walk",
    specialty: "Traditional coffee ceremony",
    priceRange: "80–150 ETB",
    openUntil: "18:00",
    nearLocationId: "emperor-hall",
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
    reason: "Light snacks and cool drinks when energy dips.",
  },
];

export const products: Product[] = [
  {
    id: "prod-warrior-cloak",
    name: "Replica Warrior Cloak",
    description: "Handcrafted cloak inspired by Adwa-era warrior attire.",
    priceETB: 2500,
    category: "apparel",
    locationId: "5gna-ber",
  },
  {
    id: "prod-shield-print",
    name: "Shield Art Print",
    description: "Museum-quality print of a traditional highland shield motif.",
    priceETB: 850,
    category: "art",
    locationId: "5gna-ber",
  },
  {
    id: "prod-map-scroll",
    name: "Adwa Campaign Map Scroll",
    description: "Decorative scroll of the 1896 campaign routes.",
    priceETB: 1200,
    category: "souvenir",
    locationId: "6gna-ber",
  },
  {
    id: "prod-taytu-scarf",
    name: "Taytu Heritage Scarf",
    description: "Soft woven scarf with Empress Taytu inspired patterns.",
    priceETB: 1800,
    category: "apparel",
    locationId: "emperor-hall",
  },
  {
    id: "prod-victory-medal",
    name: "Commemorative Victory Medal",
    description: "Limited museum medal commemorating the Battle of Adwa.",
    priceETB: 950,
    category: "souvenir",
    locationId: "victory-court",
  },
];

export function getLocationByBeacon(beaconIdOrName: string) {
  const key = String(beaconIdOrName || "").toLowerCase();
  return locations.find(
    (l) =>
      l.beaconId.toLowerCase() === key ||
      l.beaconName.toLowerCase() === key ||
      l.id.toLowerCase() === key
  );
}

export function getLocationById(id: string) {
  return locations.find((l) => l.id === id);
}
