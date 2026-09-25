// Google Maps deep links. Navigation is Google's job; on a phone these open the app.

export const mapsSearchUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

/** Transit directions from wherever the phone is. Coordinates if known, else the name and address. */
export const mapsTransitUrl = (destination: string | { lat: number; lng: number }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
  )}&travelmode=transit`;
