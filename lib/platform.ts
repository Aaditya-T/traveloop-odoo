import type { TripVisibility } from "@prisma/client";

export type VisibilityTrip = {
  ownerId: string;
  visibility: TripVisibility;
  isPublic?: boolean;
};

export function isDiscoverableTrip(trip: Pick<VisibilityTrip, "visibility" | "isPublic">) {
  return trip.visibility === "PUBLIC" || trip.isPublic === true;
}

export function canViewTrip(trip: VisibilityTrip, userId?: string | null) {
  return trip.ownerId === userId || trip.visibility === "PUBLIC" || trip.visibility === "UNLISTED" || trip.isPublic === true;
}

export function canEditTrip(trip: Pick<VisibilityTrip, "ownerId">, userId?: string | null) {
  return trip.ownerId === userId;
}
