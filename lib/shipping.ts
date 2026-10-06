export const FREE_SHIPPING_THRESHOLD = 2500;
export const HARYANA_SHIPPING_FEE = 50;
export const OUTSIDE_HARYANA_SHIPPING_FEE = 100;
export const AIR_EXPRESS_SHIPPING_FEE = 175;

export const BASE_LOCATION = {
  city: "Rewari",
  state: "Haryana",
  latitude: 28.1990,
  longitude: 76.6190,
};

export function normalizePincode(pincode: string): string {
  return String(pincode ?? "").trim();
}

export async function getPincodeLocation(pincode: string) {
  const normalized = normalizePincode(pincode);

  if (!/^\d{6}$/.test(normalized)) {
    throw new Error("Invalid 6-digit PIN code");
  }

  const response = await fetch(
    `https://api.postalpincode.in/pincode/${normalized}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to verify PIN code");
  }

  const data = await response.json();
  const result = data?.[0];

  if (
    result?.Status !== "Success" ||
    !Array.isArray(result?.PostOffice) ||
    result.PostOffice.length === 0
  ) {
    throw new Error("PIN code not found");
  }

  const postOffice = result.PostOffice[0];

  return {
    pincode: normalized,
    city: postOffice.District || "",
    state: postOffice.State || "",
    division: postOffice.Division || "",
    region: postOffice.Region || "",
    postOffice: postOffice.Name || "",
  };
}

export async function getPincodeCoordinates(
  pincode: string,
  state: string,
  district: string
) {
  const query = encodeURIComponent(
    `${pincode}, ${district}, ${state}, India`
  );

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`,
    {
      cache: "no-store",
      headers: {
        "User-Agent": "Rangrez.club/1.0",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to locate PIN code");
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Location coordinates not found");
  }

  return {
    latitude: Number(data[0].lat),
    longitude: Number(data[0].lon),
  };
}

export function calculateDistance(
  latitude: number,
  longitude: number
): number {
  const earthRadiusKm = 6371;

  const lat1 = (BASE_LOCATION.latitude * Math.PI) / 180;
  const lat2 = (latitude * Math.PI) / 180;

  const deltaLat =
    ((latitude - BASE_LOCATION.latitude) * Math.PI) / 180;

  const deltaLon =
    ((longitude - BASE_LOCATION.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function calculateShipping(
  subtotal: number,
  distance: number
): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  if (distance <= 100) {
    return 65;
  }

  if (distance <= 250) {
    return 75;
  }

  if (distance <= 500) {
    return 85;
  }

  if (distance <= 1000) {
    return 100;
  }

  return 120;
}