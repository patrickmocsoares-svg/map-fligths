/**
 * Back-compat shim. New code should import from `@/lib/destinations`.
 * Kept so existing consumers (DealCard, flight.$id, opportunities) keep working.
 */
import { destinationPhoto } from "./destinations";

export function destinationImage(code: string, w = 800, h = 1000): string {
  return destinationPhoto(code, w, h);
}

export function heroImage(w = 2000): string {
  return `https://images.unsplash.com/photo-1488085061387-422e29b40080?w=${w}&auto=format&fit=crop&q=80`;
}
