import type { ModerationStatus, TripVisibility } from "@prisma/client";

export type VisibilityTrip = {
  ownerId: string;
  visibility: TripVisibility;
  isPublic?: boolean;
  moderationStatus?: ModerationStatus;
};

export function isDiscoverableTrip(trip: Pick<VisibilityTrip, "visibility" | "isPublic">) {
  return trip.visibility === "PUBLIC" || trip.isPublic === true;
}

export function isPubliclyVisibleTrip(trip: Pick<VisibilityTrip, "visibility" | "isPublic" | "moderationStatus">) {
  return isDiscoverableTrip(trip) && trip.moderationStatus !== "TAKEN_DOWN" && trip.moderationStatus !== "HIDDEN";
}

export function canViewTrip(trip: VisibilityTrip, userId?: string | null) {
  return trip.ownerId === userId || trip.visibility === "PUBLIC" || trip.visibility === "UNLISTED" || trip.isPublic === true;
}

export function canEditTrip(trip: Pick<VisibilityTrip, "ownerId">, userId?: string | null) {
  return trip.ownerId === userId;
}

export function isVisibleComment(comment: { moderationStatus?: ModerationStatus }) {
  return comment.moderationStatus !== "HIDDEN" && comment.moderationStatus !== "TAKEN_DOWN";
}
