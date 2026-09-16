import React, { useState, useMemo } from "react";
import {
  Utensils,
  UtensilsCrossed,
  Wine,
  Coffee,
  Sparkles,
  Leaf,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plane,
  ChevronRight,
  Heart,
  Info,
  ShieldCheck,
  Flame,
  Award,
  Filter,
  Bookmark,
  ChevronDown,
  Soup,
  Cake,
  Apple,
  Croissant,
  Sun,
  Moon,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type CabinClassType = "economy" | "premium-economy" | "business" | "first";

export interface MenuItem {
  id: string;
  name: string;
  course: "starter" | "main" | "dessert" | "bakery" | "snack" | "beverage";
  description: string;
  dietary: "veg" | "non-veg" | "vegan" | "jain" | "halal";
  isChefSpecial?: boolean;
  caloriesKcal: number;
  allergens: string[];
  pairing?: string;
  serviceType: "Breakfast" | "Lunch & Dinner" | "Anytime Refreshment" | "Pre-Arrival";
  imageEmoji?: string;
  spiciness?: 0 | 1 | 2 | 3;
}

export interface BeverageItem {
  id: string;
  category: "Champagne & Wine" | "Craft Spirits" | "Artisanal Teas & Coffee" | "Signature Mocktails & Juices";
  name: string;
  description: string;
  origin?: string;
  alcoholByVolume?: string;
  isExclusive?: boolean;
}

export interface RouteDiningProfile {
  routeKey: string;
  flightNumber: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  duration: string;
  flightType: "domestic-short" | "regional-medium" | "long-haul";
  serviceRhythm: string[];
  cabinMenus: Record<
    CabinClassType,
    {
      cabinName: string;
      diningStyle: string;
      highlights: string[];
      tableware: string;
      beverageHighlights: string;
      menuItems: MenuItem[];
      cellar: BeverageItem[];
    }
  >;
}

// Full culinary data across domestic, regional, and long-haul routes
export const ROUTE_DINING_DATA: Record<string, RouteDiningProfile> = {
  "DEL-BOM": {
    routeKey: "DEL-BOM",
    flightNumber: "SW-204",
    originCode: "DEL",
    originCity: "Delhi",
    destinationCode: "BOM",
    destinationCity: "Mumbai",
    duration: "2h 10m",
    flightType: "domestic-short",
    serviceRhythm: ["Warm Towel Refreshment", "Main Hot Meal & Beverage Cart", "Signature Masala Chai / Artisan Coffee"],
    cabinMenus: {
      economy: {
        cabinName: "Economy Class",
        diningStyle: "Complimentary Hot Entrée & Beverage Service",
        highlights: ["Warm boxed regional entrées", "Choice of Vegetarian & Non-Vegetarian", "Freshly baked Indian dessert"],
        tableware: "Eco-friendly compostable presentation tray",
        beverageHighlights: "Tea, freshly brewed filter coffee, packaged juices, and soft drinks",
        menuItems: [
          {
            id: "del-bom-eco-1",
            name: "Paneer Butter Masala with Jeera Pulao",
            course: "main",
            description: "Cottage cheese cubes simmered in a velvety spiced tomato and cashew gravy, paired with fragrant cumin basmati rice and dal tadka.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 520,
            allergens: ["Dairy", "Nuts"],
            pairing: "Chilled Mango Frooti or Fresh Masala Chaas",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍛",
            spiciness: 2,
          },
          {
            id: "del-bom-eco-2",
            name: "Awadhi Murgh Biryani with Mirch Baingan Salan",
            course: "main",
            description: "Aromatic long-grain basmati layered with tender chicken marinated in saffron, rose water, and brown onions.",
            dietary: "non-veg",
            caloriesKcal: 610,
            allergens: ["Dairy"],
            pairing: "Fresh Lime Mint Soda",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍗",
            spiciness: 2,
          },
          {
            id: "del-bom-eco-3",
            name: "South Indian Medu Vada & Masala Podi Idli",
            course: "main",
            description: "Golden crispy lentil donuts and steamed rice cakes tossed in spiced gunpowder, served with coconut chutney and piping hot sambar.",
            dietary: "veg",
            caloriesKcal: 410,
            allergens: ["Mustard Seeds"],
            pairing: "South Indian Filter Coffee",
            serviceType: "Breakfast",
            imageEmoji: "🥞",
            spiciness: 1,
          },
          {
            id: "del-bom-eco-4",
            name: "Classic Warm Gulab Jamun with Pista Garnish",
            course: "dessert",
            description: "Milk solid dumplings soaked in green cardamom and rose scented sugar syrup.",
            dietary: "veg",
            caloriesKcal: 260,
            allergens: ["Dairy", "Gluten", "Nuts"],
            pairing: "Warm Cardamom Tea",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍯",
          },
        ],
        cellar: [
          { id: "b-eco-1", category: "Artisanal Teas & Coffee", name: "SkyWay Signature Masala Chai", description: "Infused with freshly crushed ginger, green cardamom, and Assam black tea" },
          { id: "b-eco-2", category: "Signature Mocktails & Juices", name: "Alphonso Mango Nectar", description: "Pure Ratnagiri Alphonso mango pulp with a squeeze of key lime" },
          { id: "b-eco-3", category: "Artisanal Teas & Coffee", name: "Roasted Chicory Filter Coffee", description: "Brewed fresh with whole milk" },
        ],
      },
      "premium-economy": {
        cabinName: "Premium Economy",
        diningStyle: "Enhanced Multi-Course Plated Service",
        highlights: ["Welcome herbal infusion beverage", "Plated hot meal with warm bread rolls", "Choice of 3 main courses", "Artisan dessert"],
        tableware: "Light porcelain china & stainless steel cutlery",
        beverageHighlights: "Premium single-estate teas, craft mocktails, and fresh juices",
        menuItems: [
          {
            id: "del-bom-pe-1",
            name: "Smoked Chicken Tikka Chaat with Mint Glaze",
            course: "starter",
            description: "Clay-oven charred chicken tossed with pomegranate pearls, crispy sev, and sweet tamarind coulis.",
            dietary: "non-veg",
            caloriesKcal: 280,
            allergens: ["Dairy"],
            pairing: "Sparkling Ginger Lime Spritzer",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥗",
            spiciness: 2,
          },
          {
            id: "del-bom-pe-2",
            name: "Subz Dum Handi with Multigrain Paratha",
            course: "main",
            description: "Farm-fresh winter vegetables cooked under sealed pastry dough in rich onion-tomato gravy.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 490,
            allergens: ["Gluten", "Dairy"],
            pairing: "Chilled Buttermilk with Roasted Cumin",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍲",
            spiciness: 1,
          },
          {
            id: "del-bom-pe-3",
            name: "Grilled Basa Fillet in Malabar Coconut Mustard Sauce",
            course: "main",
            description: "Pan-seared fish fillet over steamed turmeric rice with curry leaf tempered shallots.",
            dietary: "non-veg",
            caloriesKcal: 530,
            allergens: ["Fish", "Mustard"],
            pairing: "Lemon Grass Ice Tea",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🐟",
            spiciness: 2,
          },
          {
            id: "del-bom-pe-4",
            name: "Saffron Phirni with Silver Leaf & Almond Slivers",
            course: "dessert",
            description: "Slow-cooked Kashmiri rice pudding infused with pure saffron strands and kewra essence in an earthen matka.",
            dietary: "veg",
            caloriesKcal: 310,
            allergens: ["Dairy", "Nuts"],
            pairing: "Darjeeling First Flush",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍮",
          },
        ],
        cellar: [
          { id: "b-pe-1", category: "Signature Mocktails & Juices", name: "Royal Hibiscus Rose Fizz", description: "Wild hibiscus tea steeped with rose petals and sparkling spring water" },
          { id: "b-pe-2", category: "Artisanal Teas & Coffee", name: "Single-Origin Darjeeling First Flush", description: "Delicate muscatel notes from the Himalayan foothills" },
          { id: "b-pe-3", category: "Signature Mocktails & Juices", name: "Kokum Cumin Cooler", description: "Tangy coastal kokum extract with rock salt and roasted cumin" },
        ],
      },
      business: {
        cabinName: "Business Class",
        diningStyle: "Fine Dining On Demand on Narumi Fine Bone China",
        highlights: ["Signature welcome beverage & amuse-bouche", "Warm artisanal bread basket", "3-course à la carte selection", "Curated domestic and international wine cellar"],
        tableware: "Fine Bone China, Schott Zwiesel crystal stemware & linen serviettes",
        beverageHighlights: "Veuve Clicquot champagne, French & Italian vintage wines, Nespresso coffee",
        menuItems: [
          {
            id: "del-bom-biz-1",
            name: "Amuse-Bouche: Tandoori Burrata with Tomato Marmalade",
            course: "starter",
            description: "Creamy artisanal burrata lightly smoked over mesquite wood, drizzled with aged balsamic and basil oil.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 210,
            allergens: ["Dairy"],
            pairing: "Veuve Clicquot Brut Yellow Label Champagne",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🧀",
          },
          {
            id: "del-bom-biz-2",
            name: "Galouti Kebab Duo with Sheermal Bread & Mint Gel",
            course: "starter",
            description: "Melt-in-mouth lamb medallions slow-cooked with 32 rare spices on miniature saffron brioche flatbread.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 390,
            allergens: ["Dairy", "Gluten"],
            pairing: "Châteauneuf-du-Pape Red Wine (2020)",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍢",
            spiciness: 2,
          },
          {
            id: "del-bom-biz-3",
            name: "Pistachio Crusted Lamb Chops with Rogan Jus",
            course: "main",
            description: "Char-grilled Australian lamb cutlets rested over saffron potato mash, glazed baby carrots, and Kashmiri rogan reduction.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 680,
            allergens: ["Nuts", "Dairy"],
            pairing: "Bordeaux Grand Cru Saint-Émilion",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥩",
            spiciness: 1,
          },
          {
            id: "del-bom-biz-4",
            name: "Truffled Morels & Asparagus Biryani (Gucchi Pulao)",
            course: "main",
            description: "Wild Himalayan morel mushrooms stuffed with herbed paneer, baked in fragrant basmati under purdah pastry.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 560,
            allergens: ["Dairy", "Nuts"],
            pairing: "Cloudy Bay Sauvignon Blanc Marlborough",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍲",
            spiciness: 1,
          },
          {
            id: "del-bom-biz-5",
            name: "Valrhona Dark Chocolate Ganache Tart with Gold Leaf",
            course: "dessert",
            description: "70% Guanaja single-origin chocolate with salted caramel crunch and passion fruit coulis.",
            dietary: "veg",
            caloriesKcal: 420,
            allergens: ["Dairy", "Gluten", "Nuts"],
            pairing: "Glenfiddich 18-Year Single Malt or Nespresso Ristretto",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍫",
          },
        ],
        cellar: [
          { id: "b-biz-1", category: "Champagne & Wine", name: "Veuve Clicquot Brut Yellow Label Champagne", description: "Luminous golden sparkle with notes of brioche, ripe peach, and vanilla.", origin: "Reims, France", alcoholByVolume: "12.5%" },
          { id: "b-biz-2", category: "Champagne & Wine", name: "Cloudy Bay Sauvignon Blanc (2023)", description: "Vibrant aromas of passionfruit, lemongrass, and mineral crispness.", origin: "Marlborough, New Zealand", alcoholByVolume: "13.0%" },
          { id: "b-biz-3", category: "Craft Spirits", name: "Glenfiddich 18-Year Small Batch Single Malt", description: "Aged in Spanish Oloroso wood and American oak for rich dried fruit complexity.", origin: "Speyside, Scotland", alcoholByVolume: "40.0%" },
          { id: "b-biz-4", category: "Artisanal Teas & Coffee", name: "Nespresso Grand Cru Espresso & Lungo Selection", description: "Freshly pulled on-board espresso with rich golden crema." },
        ],
      },
      first: {
        cabinName: "First Class / SkySuite",
        diningStyle: "Michelin-Inspired Gastronomy & Caviar Service Anytime",
        highlights: ["Imperial Oscietra Caviar service", "Bespoke tasting menu by Master Chef", "Vintage Dom Pérignon Champagne", "Custom cheese trolley with honeycomb"],
        tableware: "Bernardaud Limoges porcelain & Christofle silverware",
        beverageHighlights: "Dom Pérignon Vintage Champagne, Hennessy XO Cognac, Rare aged single malts",
        menuItems: [
          {
            id: "del-bom-fc-1",
            name: "Royal Oscietra Caviar Service with Traditional Condiments",
            course: "starter",
            description: "30g tin of sustainably farmed Caspian Oscietra caviar served on crushed ice with warm buckwheat blinis, crème fraîche, chopped shallots, and mother-of-pearl spoon.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 290,
            allergens: ["Fish", "Dairy", "Gluten"],
            pairing: "Dom Pérignon Vintage 2013 Champagne",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥂",
          },
          {
            id: "del-bom-fc-2",
            name: "Sous-Vide Chilean Sea Bass in Saffron Beurre Blanc",
            course: "main",
            description: "Line-caught sea bass slow-cooked to perfection over saffron-infused potato mousseline and butter-poached asparagus spears.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 590,
            allergens: ["Fish", "Dairy"],
            pairing: "Puligny-Montrachet Premier Cru White Burgundy",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🐟",
          },
          {
            id: "del-bom-fc-3",
            name: "Shahi Nadru Kofta with Silver Vark & Kashgar Bread",
            course: "main",
            description: "Crispy lotus root dumplings filled with prunes and dried pomegranate, in velvety golden saffron cashew gravy.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 540,
            allergens: ["Dairy", "Nuts"],
            pairing: "Château Margaux Premier Grand Cru Classé",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍛",
          },
          {
            id: "del-bom-fc-4",
            name: "Deconstructed Rose Petal Kulfi with Pistachio Tuile",
            course: "dessert",
            description: "Slow-reduced organic dairy infused with hand-picked Damask rose petals, accompanied by falooda vermicelli and ruby pomegranate glaze.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 380,
            allergens: ["Dairy", "Nuts", "Gluten"],
            pairing: "Château d'Yquem Sauternes Dessert Wine",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍨",
          },
        ],
        cellar: [
          { id: "b-fc-1", category: "Champagne & Wine", name: "Dom Pérignon Vintage 2013 Champagne", description: "Incomparable complexity, white blossom aromas, and sustained silky palate.", origin: "Épernay, France", alcoholByVolume: "12.5%", isExclusive: true },
          { id: "b-fc-2", category: "Champagne & Wine", name: "Château Margaux Premier Grand Cru Classé (2015)", description: "Opulent blackcurrant, cedarwood, and velvet tannins.", origin: "Bordeaux, France", alcoholByVolume: "13.5%", isExclusive: true },
          { id: "b-fc-3", category: "Craft Spirits", name: "Hennessy X.O Cognac", description: "Rich, powerful palate of candied fruit and wild cocoa.", origin: "Cognac, France", alcoholByVolume: "40.0%", isExclusive: true },
          { id: "b-fc-4", category: "Artisanal Teas & Coffee", name: "Silver Needle White Tea from Darjeeling", description: "Hand-picked tender buds dried in natural sunlight with sweet floral undertones." },
        ],
      },
    },
  },

  "BOM-DXB": {
    routeKey: "BOM-DXB",
    flightNumber: "SW-811",
    originCode: "BOM",
    originCity: "Mumbai",
    destinationCode: "DXB",
    destinationCity: "Dubai",
    duration: "3h 30m",
    flightType: "regional-medium",
    serviceRhythm: ["Arabic Coffee & Medjool Dates on Boarding", "Multi-course Middle Eastern & Indian Dinner", "Nightcap & Chocolates"],
    cabinMenus: {
      economy: {
        cabinName: "Economy Class",
        diningStyle: "Complimentary Hot Meal with Arabic & Indian Choices",
        highlights: ["Choice of 2 hot entrées", "Pita bread & hummus salad cup", "Spiced chocolate or saffron pudding"],
        tableware: "Compostable airline tray service",
        beverageHighlights: "Soft drinks, Arabic spiced tea, mango juice, instant coffee",
        menuItems: [
          {
            id: "bom-dxb-eco-1",
            name: "Mutton Rogan Josh with Saffron Jeera Rice",
            course: "main",
            description: "Slow-braised tender mutton in Kashmiri red chili and fennel gravy, served with aromatic long-grain basmati.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 640,
            allergens: ["Dairy"],
            pairing: "Mint Lime Soda",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍖",
            spiciness: 2,
          },
          {
            id: "bom-dxb-eco-2",
            name: "Paneer Jalfrezi with Dal Makhani & Roti",
            course: "main",
            description: "Charred cottage cheese strips with bell peppers and onions in tangy tomato gravy with creamy black lentils.",
            dietary: "veg",
            caloriesKcal: 560,
            allergens: ["Dairy", "Gluten"],
            pairing: "Masala Chaas",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍛",
            spiciness: 2,
          },
          {
            id: "bom-dxb-eco-3",
            name: "Arabic Hummus & Tabbouleh Mezze Cup",
            course: "starter",
            description: "Creamy chickpea puree with extra virgin olive oil, fresh parsley, bulgur wheat, and warm pita bread.",
            dietary: "vegan",
            caloriesKcal: 220,
            allergens: ["Gluten", "Sesame"],
            pairing: "Chilled Sparkling Water",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🫒",
          },
          {
            id: "bom-dxb-eco-4",
            name: "Warm Baklava with Honey & Pistachio",
            course: "dessert",
            description: "Crispy layers of filo pastry packed with crushed nuts and soaked in blossom honey.",
            dietary: "veg",
            caloriesKcal: 290,
            allergens: ["Nuts", "Gluten", "Dairy"],
            pairing: "Cardamom Spiced Tea",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥮",
          },
        ],
        cellar: [
          { id: "bd-eco-1", category: "Artisanal Teas & Coffee", name: "Arabic Gahwa Coffee", description: "Infused with cardamom and saffron essence" },
          { id: "bd-eco-2", category: "Signature Mocktails & Juices", name: "Pomegranate Lime Spritz", description: "Sweet tart pomegranate juice with fresh mint" },
        ],
      },
      "premium-economy": {
        cabinName: "Premium Economy",
        diningStyle: "Curated 3-Course Menu on Fine Tableware",
        highlights: ["Warm bakery assortment", "Choice of 3 main courses", "Signature Middle Eastern dessert platter"],
        tableware: "Premium bone-white porcelain & stainless cutlery",
        beverageHighlights: "Mocktails, non-alcoholic malt beverages, single-estate tea",
        menuItems: [
          {
            id: "bom-dxb-pe-1",
            name: "Lebanese Mezze: Baba Ghanoush, Hummus & Falafel",
            course: "starter",
            description: "Smoked eggplant puree with tahini, crispy chickpea fritters, and marinated Kalamata olives.",
            dietary: "vegan",
            isChefSpecial: true,
            caloriesKcal: 310,
            allergens: ["Sesame", "Gluten"],
            pairing: "Sparkling Mint Lemonade",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🧆",
          },
          {
            id: "bom-dxb-pe-2",
            name: "Shish Tawook with Saffron Rice & Garlic Toum",
            course: "main",
            description: "Juicy marinated chicken skewers grilled over charcoal, served with roasted tomatoes and pickled turnips.",
            dietary: "halal",
            isChefSpecial: true,
            caloriesKcal: 580,
            allergens: ["Dairy"],
            pairing: "Pomegranate Fizz",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍢",
            spiciness: 1,
          },
          {
            id: "bom-dxb-pe-3",
            name: "Truffled Wild Mushroom & Paneer Kebab",
            course: "main",
            description: "Oven-roasted portobello mushrooms stuffed with herbed cottage cheese, served with wild rice and cashew korma.",
            dietary: "veg",
            caloriesKcal: 490,
            allergens: ["Dairy", "Nuts"],
            pairing: "Iced Hibiscus Cooler",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍄",
          },
          {
            id: "bom-dxb-pe-4",
            name: "Umm Ali with Toasted Almonds & Rose Water",
            course: "dessert",
            description: "Traditional Egyptian puff pastry pudding baked in sweet milk and topped with coconut flakes.",
            dietary: "veg",
            caloriesKcal: 340,
            allergens: ["Dairy", "Gluten", "Nuts"],
            pairing: "Moroccan Mint Tea",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥧",
          },
        ],
        cellar: [
          { id: "bd-pe-1", category: "Signature Mocktails & Juices", name: "Dubai Sunrise Fizz", description: "Blood orange, passion fruit, and sparkling water with rosemary sprig" },
          { id: "bd-pe-2", category: "Artisanal Teas & Coffee", name: "Moroccan Fresh Mint Tea", description: "Steeped gunpowder green tea with fresh spearmint leaves" },
        ],
      },
      business: {
        cabinName: "Business Class",
        diningStyle: "Arabian & International Haute Cuisine on Demand",
        highlights: ["Warm Arabic mezze carousel", "Herb-crusted lamb racks & Gulf king prawns", "Cellar wines & Laurent-Perrier Champagne", "Kunafa with clotted cream"],
        tableware: "Narumi fine porcelain, Christofle cutlery, linen tablecloth",
        beverageHighlights: "Laurent-Perrier Cuvée Rosé Champagne, Château Palmer, Macallan 15",
        menuItems: [
          {
            id: "bom-dxb-biz-1",
            name: "Grand Arabic Mezze Carousel with Warm Za'atar Manakish",
            course: "starter",
            description: "Handcrafted trio of truffle hummus, moutabal, and vine leaves with halloumi skewers and freshly baked bread.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 420,
            allergens: ["Dairy", "Gluten", "Sesame"],
            pairing: "Laurent-Perrier Cuvée Rosé Brut Champagne",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🫒",
          },
          {
            id: "bom-dxb-biz-2",
            name: "Char-Grilled Gulf Jumbo Tiger Prawns with Harissa Butter",
            course: "main",
            description: "Wild-caught Arabian Gulf king prawns basted in smoked chili garlic butter, served over saffron couscous.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 620,
            allergens: ["Shellfish", "Dairy"],
            pairing: "Sancerre Domaine Vacheron White Wine",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🦐",
            spiciness: 2,
          },
          {
            id: "bom-dxb-biz-3",
            name: "Braised Emirati Lamb Machboos with Loomi Dried Lime",
            course: "main",
            description: "Succulent lamb shank braised for 8 hours in Arabic seven-spice broth, over basmati infused with caramelized onions and roasted pine nuts.",
            dietary: "halal",
            isChefSpecial: true,
            caloriesKcal: 740,
            allergens: ["Nuts"],
            pairing: "Château Palmer Margaux (2018)",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍖",
            spiciness: 1,
          },
          {
            id: "bom-dxb-biz-4",
            name: "Warm Cheese Kunafa with Orange Blossom Syrup & Gold Vark",
            course: "dessert",
            description: "Spun pastry crust loaded with melted Akawi cheese, baked crisp and drizzled with warm orange blossom honey.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 450,
            allergens: ["Dairy", "Gluten", "Nuts"],
            pairing: "Macallan 15-Year Double Cask Whisky or Turkish Coffee",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥮",
          },
        ],
        cellar: [
          { id: "bd-biz-1", category: "Champagne & Wine", name: "Laurent-Perrier Cuvée Rosé Champagne", description: "Intense berry fruit aromas, crisp lively finish.", origin: "Tours-sur-Marne, France", alcoholByVolume: "12.0%" },
          { id: "bd-biz-2", category: "Champagne & Wine", name: "Château Palmer Margaux Grand Cru (2018)", description: "Silky black truffle, violets, and sweet spices.", origin: "Bordeaux, France", alcoholByVolume: "14.0%" },
          { id: "bd-biz-3", category: "Craft Spirits", name: "The Macallan 15-Year Double Cask", description: "Rich dried fruit, toffee, and warm oak spice.", origin: "Speyside, Scotland", alcoholByVolume: "43.0%" },
          { id: "bd-biz-4", category: "Artisanal Teas & Coffee", name: "Traditional Turkish Coffee with Cardamom", description: "Slow brewed in copper cezve with foam crest." },
        ],
      },
      first: {
        cabinName: "First Class / SkySuite",
        diningStyle: "Imperial Private Suite Dining by Celebrity Chef",
        highlights: ["Imperial Iranian Beluga Caviar", "Wagyu A5 beef & lobster tail", "Krug Clos d'Ambonnay Champagne", "Artisanal date trolley"],
        tableware: "Custom gold-trimmed Limoges china & Baccarat crystal",
        beverageHighlights: "Krug Grande Cuvée, Château Cheval Blanc, Hennessy Paradis",
        menuItems: [
          {
            id: "bom-dxb-fc-1",
            name: "Imperial Beluga Caviar with Gold Leaf & Warm Blinis",
            course: "starter",
            description: "Exclusive 50g Beluga caviar served with gold leaf flakes, quail egg mimosa, and double cream.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 340,
            allergens: ["Fish", "Dairy", "Gluten", "Eggs"],
            pairing: "Krug Grande Cuvée 170th Edition Champagne",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥂",
          },
          {
            id: "bom-dxb-fc-2",
            name: "Pan-Seared Japanese Wagyu A5 Striploin with Truffle Glaze",
            course: "main",
            description: "Kagoshima A5 Wagyu beef grilled medium-rare over charcoal, served with foie gras jus, smoked potato puree, and morels.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 820,
            allergens: ["Dairy"],
            pairing: "Château Cheval Blanc Premier Grand Cru Classé A",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥩",
          },
          {
            id: "bom-dxb-fc-3",
            name: "Butter-Poached Omani Lobster Tail with Saffron Risotto",
            course: "main",
            description: "Sweet wild lobster poached in citrus butter with Acquerello carnaroli rice and gold leaf.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 690,
            allergens: ["Shellfish", "Dairy"],
            pairing: "Meursault Premier Cru White Burgundy",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🦞",
          },
          {
            id: "bom-dxb-fc-4",
            name: "Artisanal Royal Medjool Date Soufflé with Camel Milk Gelato",
            course: "dessert",
            description: "Airy date soufflé risen to order, served with Madagascar vanilla infused camel milk gelato.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 390,
            allergens: ["Dairy", "Eggs", "Nuts"],
            pairing: "Hennessy Paradis Rare Cognac",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍨",
          },
        ],
        cellar: [
          { id: "bd-fc-1", category: "Champagne & Wine", name: "Krug Grande Cuvée 170th Edition Champagne", description: "Rich hazelnut, nougat, barley sugar, and vibrant citrus.", origin: "Reims, France", alcoholByVolume: "12.5%", isExclusive: true },
          { id: "bd-fc-2", category: "Champagne & Wine", name: "Château Cheval Blanc Premier Grand Cru (2016)", description: "Extraordinary depth, black fruit, cashmere tannins.", origin: "Saint-Émilion, France", alcoholByVolume: "14.5%", isExclusive: true },
          { id: "bd-fc-3", category: "Craft Spirits", name: "Hennessy Paradis Rare Cognac", description: "Silky floral honey, dried rose petals, and candied truffle.", origin: "Cognac, France", alcoholByVolume: "40.0%", isExclusive: true },
        ],
      },
    },
  },

  "DEL-LHR": {
    routeKey: "DEL-LHR",
    flightNumber: "SW-701",
    originCode: "DEL",
    originCity: "Delhi",
    destinationCode: "LHR",
    destinationCity: "London",
    duration: "9h 15m",
    flightType: "long-haul",
    serviceRhythm: [
      "1st Service: Multi-Course Royal Banquet Dinner after Takeoff",
      "Mid-Flight: Walk-Up Bistro Bar with Artisan Sliders & Warm Scones",
      "2nd Service: Full English / Indian Breakfast prior to Heathrow Landing",
    ],
    cabinMenus: {
      economy: {
        cabinName: "Economy Class",
        diningStyle: "Two Full Meal Services + Mid-Flight Refreshments",
        highlights: ["Main hot dinner service", "Pre-landing breakfast/hot snack", "Mid-flight ice cream and savoury pretzel packs"],
        tableware: "Recyclable meal trays with sealed hot foil covers",
        beverageHighlights: "Choice of beers, international wines, juices, soft drinks, and tea",
        menuItems: [
          {
            id: "del-lhr-eco-1",
            name: "Butter Chicken with Saffron Rice & Naan Bread",
            course: "main",
            description: "Boneless chicken thighs cooked in a rich tomato, butter, and cream sauce with basmati rice.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 680,
            allergens: ["Dairy", "Gluten"],
            pairing: "Heineken Lager or Australian Shiraz",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍗",
            spiciness: 2,
          },
          {
            id: "del-lhr-eco-2",
            name: "Paneer Tikka Masala with Dal Tadka & Basmati",
            course: "main",
            description: "Spiced chargrilled paneer cubes in bell pepper gravy with yellow lentil stew.",
            dietary: "veg",
            caloriesKcal: 590,
            allergens: ["Dairy"],
            pairing: "Chilled Apple Juice",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍛",
            spiciness: 2,
          },
          {
            id: "del-lhr-eco-3",
            name: "Warm Cheese & Chive Omelette with Chicken Sausage (Pre-Landing)",
            course: "main",
            description: "Fluffy egg omelette with roasted potato hashbrowns and baked beans in tomato sauce.",
            dietary: "non-veg",
            caloriesKcal: 480,
            allergens: ["Eggs", "Dairy"],
            pairing: "English Breakfast Tea with Milk",
            serviceType: "Breakfast",
            imageEmoji: "🍳",
          },
          {
            id: "del-lhr-eco-4",
            name: "Haagen-Dazs Belgian Chocolate Ice Cream Tub",
            course: "dessert",
            description: "Individual ice cream cup served mid-flight with chocolate crisp flakes.",
            dietary: "veg",
            caloriesKcal: 240,
            allergens: ["Dairy"],
            pairing: "Freshly brewed coffee",
            serviceType: "Anytime Refreshment",
            imageEmoji: "🍨",
          },
        ],
        cellar: [
          { id: "bl-eco-1", category: "Champagne & Wine", name: "Jacob's Creek Classic Shiraz / Chardonnay", description: "Australian selection served in 187ml single-serve bottles" },
          { id: "bl-eco-2", category: "Artisanal Teas & Coffee", name: "Twinings English Breakfast Tea", description: "Classic British blend" },
        ],
      },
      "premium-economy": {
        cabinName: "Premium Economy",
        diningStyle: "Elevated Dining with Welcome Drinks & High Tea",
        highlights: ["Welcome sparkling wine", "3 hot dinner choices served on china", "Traditional English High Tea with clotted cream scones"],
        tableware: "Fine porcelain china, linen napkins & metallic cutlery",
        beverageHighlights: "French wine selection, signature cocktails, artisanal hot chocolate",
        menuItems: [
          {
            id: "del-lhr-pe-1",
            name: "Smoked Scottish Salmon with Caper Berry Salad",
            course: "starter",
            description: "Oak-smoked salmon ribbon with horseradish crème fraîche, baby spinach, and rye croutes.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 260,
            allergens: ["Fish", "Dairy", "Gluten"],
            pairing: "Prosecco Superiore DOCG",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥗",
          },
          {
            id: "del-lhr-pe-2",
            name: "Braised British Beef Shin with Mashed Potatoes & Red Wine Jus",
            course: "main",
            description: "Tender beef shank braised with thyme and shallots, with buttered parsnips and green beans.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 710,
            allergens: ["Dairy"],
            pairing: "Bordeaux Rouge AOC",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥩",
          },
          {
            id: "del-lhr-pe-3",
            name: "Wild Forest Mushroom & Truffle Ravioli",
            course: "main",
            description: "Handmade egg pasta filled with porcini and ricotta in a creamy sage butter sauce with shaved parmesan.",
            dietary: "veg",
            caloriesKcal: 560,
            allergens: ["Dairy", "Gluten", "Eggs"],
            pairing: "Italian Pinot Grigio",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥟",
          },
          {
            id: "del-lhr-pe-4",
            name: "Warm Devonshire Scones with Clotted Cream & Strawberry Jam",
            course: "dessert",
            description: "Freshly baked buttermilk scones served during pre-landing afternoon tea service.",
            dietary: "veg",
            caloriesKcal: 380,
            allergens: ["Dairy", "Gluten"],
            pairing: "Earl Grey Bergamot Tea",
            serviceType: "Pre-Arrival",
            imageEmoji: "🫖",
          },
        ],
        cellar: [
          { id: "bl-pe-1", category: "Champagne & Wine", name: "Villa Sandi Prosecco Superiore DOCG", description: "Crisp golden apple and white acacia blossom", origin: "Valdobbiadene, Italy", alcoholByVolume: "11.5%" },
          { id: "bl-pe-2", category: "Champagne & Wine", name: "Château La Tour de Bessan Margaux", description: "Ripe blackberry and subtle oak", origin: "Bordeaux, France", alcoholByVolume: "13.5%" },
        ],
      },
      business: {
        cabinName: "Business Class",
        diningStyle: "5-Star Multi-Course Dining on Demand",
        highlights: ["Dine on Demand throughout the 9 hour flight", "Caviar amuse-bouche & bread basket", "Selection of 4 gourmet entrées", "British cheese board with Port wine"],
        tableware: "Royal Doulton fine bone china, Riedel glassware & crisp white linen",
        beverageHighlights: "Taittinger Comtes de Champagne, Premier Cru Burgundy, The Balvenie 14",
        menuItems: [
          {
            id: "del-lhr-biz-1",
            name: "Pan-Seared Hand-Dived Scallops with Cauliflower Velouté",
            course: "starter",
            description: "King scallops seared with crispy pancetta crumb, green apple batons, and white truffle oil.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 310,
            allergens: ["Shellfish", "Dairy"],
            pairing: "Taittinger Brut Réserve Champagne",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🦪",
          },
          {
            id: "del-lhr-biz-2",
            name: "Dry-Aged Angus Beef Tenderloin with Truffle Jus & Dauphinoise",
            course: "main",
            description: "Char-grilled 28-day aged tenderloin with gratin dauphinoise potatoes and roasted baby heirloom carrots.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 780,
            allergens: ["Dairy"],
            pairing: "Saint-Julien Grand Cru Classé Bordeaux",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥩",
          },
          {
            id: "del-lhr-biz-3",
            name: "Royal Mughlai Gucchi Pulao & Paneer Pasanda",
            course: "main",
            description: "Stuffed paneer escalopes in golden almond gravy served with Himalayan morel mushroom pulao and saffron paratha.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 630,
            allergens: ["Dairy", "Nuts", "Gluten"],
            pairing: "Meursault White Burgundy",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍲",
            spiciness: 1,
          },
          {
            id: "del-lhr-biz-4",
            name: "Artisan British Cheese Board with Quince Jelly & Crackers",
            course: "dessert",
            description: "Colston Bassett Stilton, Quicke's Vintage Cheddar, and Somerset Camembert with charcoal crackers and grapes.",
            dietary: "veg",
            caloriesKcal: 410,
            allergens: ["Dairy", "Gluten"],
            pairing: "Taylor's 20-Year Old Tawny Port",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🧀",
          },
        ],
        cellar: [
          { id: "bl-biz-1", category: "Champagne & Wine", name: "Taittinger Brut Réserve Champagne", description: "Elegance, mineral freshness with brioche and peach notes.", origin: "Reims, France", alcoholByVolume: "12.5%" },
          { id: "bl-biz-2", category: "Champagne & Wine", name: "Château Léoville Poyferré Saint-Julien (2017)", description: "Cassis, graphite, and toasted spice notes.", origin: "Bordeaux, France", alcoholByVolume: "14.0%" },
          { id: "bl-biz-3", category: "Craft Spirits", name: "The Balvenie 14-Year Caribbean Cask Single Malt", description: "Finished in rum casks for exotic passion fruit and toffee notes.", origin: "Speyside, Scotland", alcoholByVolume: "43.0%" },
          { id: "bl-biz-4", category: "Champagne & Wine", name: "Taylor's 20-Year-Old Tawny Port", description: "Nutty walnuts, dried figs, and mellow oak finish.", origin: "Douro, Portugal", alcoholByVolume: "20.0%" },
        ],
      },
      first: {
        cabinName: "First Class / SkySuite",
        diningStyle: "Grand Sommelier Tasting Menu & Royal Afternoon Tea",
        highlights: ["Royal Oscietra Caviar presentation", "A La Carte Dine Anytime Chef Service", "Dom Pérignon & Krug Champagne", "Pre-order signature dishes ahead of flight"],
        tableware: "Hermès china, Saint-Louis crystal glassware & Christofle cutlery",
        beverageHighlights: "Dom Pérignon Vintage, Penfolds Grange, Johnnie Walker Blue Label",
        menuItems: [
          {
            id: "del-lhr-fc-1",
            name: "Classic Oscietra Caviar Service with Mother-of-Pearl Spoon",
            course: "starter",
            description: "Chilled sturgeon caviar with warm buckwheat blinis, organic egg yolk crumble, and chives.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 280,
            allergens: ["Fish", "Dairy", "Eggs", "Gluten"],
            pairing: "Dom Pérignon Vintage 2013",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥂",
          },
          {
            id: "del-lhr-fc-2",
            name: "Classic Beef Wellington with Périgord Truffle Sauce",
            course: "main",
            description: "Prime Angus fillet wrapped in mushroom duxelles, prosciutto, and crisp puff pastry, served with pomme purée.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 850,
            allergens: ["Gluten", "Dairy", "Eggs"],
            pairing: "Penfolds Grange Shiraz (2018)",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🥩",
          },
          {
            id: "del-lhr-fc-3",
            name: "Wild Turbot Fillet with Champagne Saffron Foam",
            course: "main",
            description: "Pan-roasted Atlantic turbot over braised leeks, Romanesco broccoli, and oscietra caviar emulsion.",
            dietary: "non-veg",
            isChefSpecial: true,
            caloriesKcal: 610,
            allergens: ["Fish", "Dairy"],
            pairing: "Chassagne-Montrachet Premier Cru",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🐟",
          },
          {
            id: "del-lhr-fc-4",
            name: "Warm Valrhona Chocolate Soufflé with Pistachio Crème",
            course: "dessert",
            description: "Molten chocolate soufflé prepared in the galley oven, poured with warm bourbon vanilla cream.",
            dietary: "veg",
            isChefSpecial: true,
            caloriesKcal: 440,
            allergens: ["Dairy", "Eggs", "Gluten", "Nuts"],
            pairing: "Johnnie Walker Blue Label King George V",
            serviceType: "Lunch & Dinner",
            imageEmoji: "🍫",
          },
        ],
        cellar: [
          { id: "bl-fc-1", category: "Champagne & Wine", name: "Dom Pérignon Vintage 2013 Champagne", description: "Legendary balance of silkiness and smoky minerality.", origin: "Épernay, France", alcoholByVolume: "12.5%", isExclusive: true },
          { id: "bl-fc-2", category: "Champagne & Wine", name: "Penfolds Grange Shiraz (2018)", description: "Australia's iconic collector wine with intense blackberry and mocha.", origin: "South Australia", alcoholByVolume: "14.5%", isExclusive: true },
          { id: "bl-fc-3", category: "Craft Spirits", name: "Johnnie Walker Blue Label Blended Scotch Whisky", description: "Velvety smoke, sandalwood, hazelnut, and dark chocolate.", origin: "Scotland", alcoholByVolume: "40.0%", isExclusive: true },
        ],
      },
    },
  },
};

// Special Dietary / SSR options catalogue
export const SSR_MEALS_INFO = [
  { code: "AVML", name: "Asian Vegetarian Meal", desc: "Spiced vegetarian meal with paneer/lentils/vegetables, rice and bread. No meat, fish, or eggs.", icon: "🥗" },
  { code: "VGML", name: "Vegan Meal", desc: "Strictly plant-based meal. Free from animal products, dairy, eggs, honey.", icon: "🌱" },
  { code: "VJML", name: "Vegetarian Jain Meal", desc: "Prepared according to Jain principles. No root vegetables (onions, garlic, potatoes, carrots).", icon: "🕉️" },
  { code: "HNML", name: "Hindu Non-Vegetarian", desc: "Prepared with poultry, fish or lamb. Strictly no beef or beef derivatives.", icon: "🍗" },
  { code: "MOML", name: "Muslim / Halal Meal", desc: "100% Halal certified meat and ingredients. Strictly no pork or alcohol.", icon: "🌙" },
  { code: "GFML", name: "Gluten-Friendly Meal", desc: "Made without ingredients containing gluten (wheat, rye, barley).", icon: "🌾" },
  { code: "DBML", name: "Diabetic Meal", desc: "Low sugar, high complex carbohydrates and lean proteins.", icon: "🩺" },
  { code: "CHML", name: "Child Meal", desc: "Fun, nutritious, easy-to-chew meals favored by young travelers (2-12 years).", icon: "🧒" },
];

export interface InFlightDiningPreviewProps {
  initialRouteKey?: string;
  initialCabinClass?: CabinClassType;
  selectedPnr?: string;
  className?: string;
  onReserveMeal?: (meal: MenuItem, route: RouteDiningProfile, cabin: CabinClassType) => void;
}

export function InFlightDiningPreview({
  initialRouteKey = "DEL-BOM",
  initialCabinClass = "business",
  selectedPnr = "SW8X4K",
  className,
  onReserveMeal,
}: InFlightDiningPreviewProps) {
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>(initialRouteKey);
  const [selectedCabin, setSelectedCabin] = useState<CabinClassType>(initialCabinClass);
  const [activeCourseFilter, setActiveCourseFilter] = useState<string>("all");
  const [dietaryFilter, setDietaryFilter] = useState<string>("all");
  const [activeServiceTab, setActiveServiceTab] = useState<"menu" | "cellar" | "ssr" | "timing">("menu");
  const [reservedMealId, setReservedMealId] = useState<string | null>("del-bom-biz-3");
  const [showNutritionModal, setShowNutritionModal] = useState<MenuItem | null>(null);

  // Active route profile
  const activeRoute = ROUTE_DINING_DATA[selectedRouteKey] || ROUTE_DINING_DATA["DEL-BOM"];
  const activeCabinMenu = activeRoute.cabinMenus[selectedCabin] || activeRoute.cabinMenus.business;

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return activeCabinMenu.menuItems.filter((item) => {
      // Course filter
      if (activeCourseFilter !== "all" && item.course !== activeCourseFilter) {
        return false;
      }
      // Dietary filter
      if (dietaryFilter === "veg" && item.dietary !== "veg" && item.dietary !== "vegan" && item.dietary !== "jain") {
        return false;
      }
      if (dietaryFilter === "non-veg" && item.dietary !== "non-veg" && item.dietary !== "halal") {
        return false;
      }
      if (dietaryFilter === "vegan" && item.dietary !== "vegan") {
        return false;
      }
      if (dietaryFilter === "chef" && !item.isChefSpecial) {
        return false;
      }
      return true;
    });
  }, [activeCabinMenu, activeCourseFilter, dietaryFilter]);

  const handleSelectMeal = (item: MenuItem) => {
    setReservedMealId(item.id);
    toast.success(`Entrée reserved: ${item.name}`, {
      description: `Pre-selected for PNR ${selectedPnr} in ${activeCabinMenu.cabinName}. Our cabin crew will prepare your choice.`,
    });
    if (onReserveMeal) {
      onReserveMeal(item, activeRoute, selectedCabin);
    }
  };

  const handleSpecialMealSelect = (code: string, name: string) => {
    toast.success(`Special Dietary Meal (${code}) Saved`, {
      description: `${name} has been added to your upcoming flight preference for ${activeRoute.flightNumber}.`,
    });
  };

  return (
    <div
      id="inflight-dining-preview"
      className={cn(
        "overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {/* Top Header & Context Strip */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-sky-500/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600 font-bold text-white shadow-xs text-[11px] px-2.5 py-0.5 flex items-center gap-1">
                <Utensils className="h-3 w-3" />
                SkyWay Gourmet Culinary Preview
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                Route-Specific Menus & Wine Cellar
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                In-Flight Dining & Beverage Cellar
              </h3>
            </div>

            <p className="text-xs text-slate-600 font-medium max-w-2xl">
              Explore freshly prepared regional meals, multi-course haute cuisine, and sommelier beverage pairings crafted specifically for your aircraft and route.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/90 p-3 border border-amber-200/60 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">Pre-Order Guarantee</div>
              <div className="text-xs font-extrabold text-slate-800">Reserve up to 24h before flight</div>
            </div>
          </div>
        </div>

        {/* CONTROLS: ROUTE SELECTOR + CABIN CLASS SELECTOR */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Route Switcher (7 cols) */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Plane className="h-3.5 w-3.5 text-blue-600" />
              Select Flight Route:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.values(ROUTE_DINING_DATA).map((route) => {
                const isSelected = selectedRouteKey === route.routeKey;
                return (
                  <button
                    key={route.routeKey}
                    type="button"
                    onClick={() => {
                      setSelectedRouteKey(route.routeKey);
                      setActiveCourseFilter("all");
                    }}
                    className={cn(
                      "flex flex-col rounded-xl p-2.5 text-left border transition-all text-xs",
                      isSelected
                        ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-white/70 border-slate-200 hover:bg-white text-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between font-extrabold text-slate-900">
                      <span>{route.originCode} &rarr; {route.destinationCode}</span>
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                        {route.flightNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {route.originCity} to {route.destinationCity}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {route.duration}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cabin Class Switcher (6 cols) */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-600" />
              Select Cabin Experience:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: "economy", label: "Economy", icon: "💺", badge: "Hot Meals" },
                  { id: "premium-economy", label: "Prem Econ", icon: "✨", badge: "Plated" },
                  { id: "business", label: "Business", icon: "🥂", badge: "Dine on Demand" },
                  { id: "first", label: "First Suite", icon: "👑", badge: "Caviar & Tasting" },
                ] as const
              ).map((c) => {
                const isSelected = selectedCabin === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCabin(c.id);
                      setActiveCourseFilter("all");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl p-2 text-center border transition-all text-xs",
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-xs font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                    )}
                  >
                    <span className="text-base mb-0.5">{c.icon}</span>
                    <span className="line-clamp-1">{c.label}</span>
                    <span
                      className={cn(
                        "text-[9px] mt-0.5 px-1.5 py-0.2 rounded-full",
                        isSelected ? "bg-amber-400 text-slate-950 font-black" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {c.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CABIN STYLE HIGHLIGHTS BANNER */}
      <div className="bg-slate-900 text-white px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                {activeCabinMenu.cabinName} Culinary Program
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-medium text-slate-200">{activeCabinMenu.diningStyle}</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span><strong>Tableware:</strong> {activeCabinMenu.tableware}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCabinMenu.highlights.map((h, i) => (
            <span key={i} className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-200">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* SECONDARY NAVIGATION TABS (Menu, Cellar, Dietary/SSR, Flight Service Rhythm) */}
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {[
            { id: "menu", label: "A La Carte Menu", icon: Utensils },
            { id: "cellar", label: "Sommelier Cellar & Beverages", icon: Wine },
            { id: "ssr", label: "Special Dietary & SSR (8 Options)", icon: Leaf },
            { id: "timing", label: "Service Rhythm & Galley Standards", icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeServiceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveServiceTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeServiceTab === "menu" && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Dietary:</span>
            {[
              { id: "all", label: "All" },
              { id: "veg", label: "Vegetarian (VGML)" },
              { id: "non-veg", label: "Non-Veg" },
              { id: "vegan", label: "Vegan" },
              { id: "chef", label: "Chef Signature" },
            ].map((df) => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDietaryFilter(df.id)}
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors",
                  dietaryFilter === df.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                )}
              >
                {df.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB CONTENT CONTAINER */}
      <div className="p-5 sm:p-6">
        {/* 1. MENU VIEW */}
        {activeServiceTab === "menu" && (
          <div className="space-y-6">
            {/* Course Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                {[
                  { id: "all", label: "Full Menu" },
                  { id: "starter", label: "Starters & Mezze" },
                  { id: "main", label: "Main Entrées" },
                  { id: "dessert", label: "Desserts & Cheese" },
                ].map((cf) => (
                  <button
                    key={cf.id}
                    type="button"
                    onClick={() => setActiveCourseFilter(cf.id)}
                    className={cn(
                      "rounded-lg px-3 py-1 text-xs font-bold transition-colors",
                      activeCourseFilter === cf.id
                        ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {cf.label}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Showing {filteredMenuItems.length} dishes available for {activeRoute.originCode} &rarr; {activeRoute.destinationCode}
              </div>
            </div>

            {/* Menu Items Grid */}
            {filteredMenuItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <Utensils className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No dishes matching the active filter.</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the dietary or course filter above.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDietaryFilter("all");
                    setActiveCourseFilter("all");
                  }}
                  className="mt-3 text-xs"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => {
                  const isReserved = reservedMealId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all duration-200",
                        isReserved
                          ? "border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs"
                      )}
                    >
                      {/* Top Badges */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Dietary badge */}
                            {item.dietary === "veg" && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 border border-emerald-300/60">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                Vegetarian (VGML)
                              </span>
                            )}
                            {item.dietary === "non-veg" && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 border border-rose-300/60">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                                Non-Veg
                              </span>
                            )}
                            {item.dietary === "vegan" && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2 py-0.5 border border-teal-300/60">
                                <Leaf className="h-2.5 w-2.5 text-teal-600" />
                                100% Vegan
                              </span>
                            )}
                            {item.dietary === "halal" && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 border border-indigo-300/60">
                                Halal Certified
                              </span>
                            )}
                            {item.isChefSpecial && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 border border-amber-300/60">
                                <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                                Chef Signature
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xl">{item.imageEmoji || "🍽️"}</span>
                          </div>
                        </div>

                        {/* Title & Service Type */}
                        <div className="mt-2.5">
                          <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                            {item.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            Service: {item.serviceType} &bull; Course: {item.course.toUpperCase()}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Sommelier Pairing note if present */}
                        {item.pairing && (
                          <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-slate-50 p-2 text-[11px] text-slate-700 border border-slate-100">
                            <Wine className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">
                              <strong>Recommended Pairing:</strong> {item.pairing}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer Action & Nutrition info */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
                            <Flame className="h-3.5 w-3.5 text-amber-500" />
                            {item.caloriesKcal} kcal
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowNutritionModal(item)}
                            className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
                          >
                            <Info className="h-3 w-3" />
                            Allergens ({item.allergens.length})
                          </button>
                        </div>

                        <div>
                          {isReserved ? (
                            <Button
                              size="sm"
                              disabled
                              className="h-8 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-2xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Selected for Flight
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectMeal(item)}
                              className="h-8 rounded-xl border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white transition-colors"
                            >
                              <Bookmark className="h-3 w-3 mr-1 text-slate-400" />
                              Pre-Select Dish
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. SOMMELIER CELLAR & BEVERAGE LIST */}
        {activeServiceTab === "cellar" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Wine className="h-4 w-4 text-purple-600" />
                  Curated Cellar & Beverages for {activeCabinMenu.cabinName}
                </h4>
                <p className="text-xs text-slate-500">
                  {activeCabinMenu.beverageHighlights}
                </p>
              </div>
              <Badge className="bg-purple-600 font-bold text-white text-xs">
                Sommelier Selected
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCabinMenu.cellar.map((drink) => (
                <div
                  key={drink.id}
                  className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-xs"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                    {drink.category.includes("Champagne") ? (
                      <Wine className="h-5 w-5" />
                    ) : drink.category.includes("Tea") || drink.category.includes("Coffee") ? (
                      <Coffee className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.2 rounded-md border border-purple-200">
                        {drink.category}
                      </span>
                      {drink.isExclusive && (
                        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full">
                          First Suite Exclusive
                        </span>
                      )}
                    </div>
                    <h5 className="text-sm font-extrabold text-slate-900">{drink.name}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">{drink.description}</p>
                    {drink.origin && (
                      <div className="text-[10px] text-slate-400 font-medium">
                        Region: <strong>{drink.origin}</strong> {drink.alcoholByVolume && `• ABV: ${drink.alcoholByVolume}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SPECIAL DIETARY & SSR MEAL CATALOGUE */}
        {activeServiceTab === "ssr" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-emerald-600" />
                  Special Dietary Requirements & IATA SSR Codes
                </h4>
                <p className="text-xs text-slate-500">
                  Pre-order verified dietary meals prepared in certified kitchens at no additional charge
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Complimentary Across All Cabins
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SSR_MEALS_INFO.map((ssr) => (
                <div
                  key={ssr.code}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{ssr.icon}</span>
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {ssr.code}
                      </span>
                    </div>
                    <h5 className="text-xs font-extrabold text-slate-900 mt-2">{ssr.name}</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ssr.desc}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSpecialMealSelect(ssr.code, ssr.name)}
                    className="mt-3 w-full h-7 text-[11px] font-bold rounded-xl border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white"
                  >
                    Request {ssr.code}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SERVICE RHYTHM & GALLEY STANDARDS */}
        {activeServiceTab === "timing" && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Flight Service Sequence: {activeRoute.flightNumber} ({activeRoute.originCity} to {activeRoute.destinationCity})
              </h4>
              <p className="text-xs text-slate-500">
                Flight duration: {activeRoute.duration} &bull; Route classification: {activeRoute.flightType.toUpperCase()}
              </p>
            </div>

            <div className="space-y-3">
              {activeRoute.serviceRhythm.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-mono text-xs font-black text-white">
                    0{index + 1}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">{step}</div>
                    <div className="text-[11px] text-slate-500">
                      Coordinated with flight cruising altitudes and passenger rest cycles.
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quality & Food Safety Banner */}
            <div className="mt-4 rounded-2xl bg-amber-50/70 p-4 border border-amber-200/60 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <div className="font-extrabold">HACCP & ISO 22000 Aviation Food Safety Certified</div>
                <p className="text-amber-800/80 leading-relaxed">
                  All SkyWay in-flight meals are prepared in temperature-regulated clean-room flight kitchens under strict blast-chilling standards and oven-regenerated on board to preserve moisture, aroma, and delicate textures.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ALLERGENS & NUTRITION POPUP DIALOG */}
      {showNutritionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{showNutritionModal.imageEmoji}</span>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{showNutritionModal.name}</h4>
                  <span className="text-xs text-slate-500">Nutritional & Allergen Breakdown</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNutritionModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                <span className="font-bold">Total Energy:</span>
                <span className="font-mono font-black text-amber-600 text-sm">{showNutritionModal.caloriesKcal} kcal</span>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1.5">Declared Allergens:</span>
                <div className="flex flex-wrap gap-1.5">
                  {showNutritionModal.allergens.length > 0 ? (
                    showNutritionModal.allergens.map((alg) => (
                      <span
                        key={alg}
                        className="rounded-full bg-rose-50 text-rose-800 px-2.5 py-0.5 text-xs font-bold border border-rose-200"
                      >
                        ⚠️ {alg}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">No major allergens reported.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Dietary Classification:</span>
                <p className="text-slate-600 leading-relaxed">{showNutritionModal.description}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <Button
                size="sm"
                onClick={() => setShowNutritionModal(null)}
                className="rounded-xl text-xs font-bold"
              >
                Close Breakdown
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
