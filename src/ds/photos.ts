/**
 * The development photography library (public/photos, credits in
 * public/photos/CREDITS.md): responsive AVIF sets with a JPEG fallback.
 * Every photo is chosen for the feature it explains; nothing is random.
 */
export type PhotoName =
  | "cafe-latte-art" | "coffee-interior" | "cafe-window" | "food-plate" | "restaurant-interior" | "restaurant-warm" | "cafe-cozy" | "latte-cup" | "barista-2"
  | "car-road" | "car-night" | "car-side" | "woman-portrait-2" | "man-portrait" | "man-portrait-2" | "woman-smile" | "creator-phone" | "storefront" | "storefront-2"
  | "bakery-2" | "flowers-shop" | "pizza" | "smoothie" | "wallet-phone" | "phone-hand";

export type PhotoSet = { src: string; srcSet: string; type: "image/avif"; fallback: string };

export function photo(name: PhotoName): PhotoSet {
  const base = `/photos/${name}`;
  return { src: `${base}-1200.avif`, srcSet: `${base}-640.avif 640w, ${base}-1200.avif 1200w, ${base}-1800.avif 1800w`, type: "image/avif", fallback: `${base}-1200.jpg` };
}

/** The isolated car renders (transparent), for the car presentation. */
export const CARS = {
  wagon: { src: "/photos/cars/wagon-1600.webp", small: "/photos/cars/wagon-900.webp", png: "/photos/cars/wagon-1600.png", width: 1393, height: 585, name: "Oxblood wagon" },
  sedan: { src: "/photos/cars/sedan-1600.webp", small: "/photos/cars/sedan-900.webp", png: "/photos/cars/sedan-1600.png", width: 1369, height: 651, name: "Silver sedan" },
  hatch: { src: "/photos/cars/hatch-1600.webp", small: "/photos/cars/hatch-900.webp", png: "/photos/cars/hatch-1600.png", width: 1292, height: 635, name: "Blue hatchback" },
} as const;
export type CarName = keyof typeof CARS;
