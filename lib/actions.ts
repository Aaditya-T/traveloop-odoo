"use server";

import { randomBytes } from "node:crypto";
import { ActivityCategory, BudgetCategory, ChecklistCategory, PaymentStatus, Prisma, ReportStatus, TripVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, hashPassword, requireAdmin, requireUser, verifyPassword } from "@/lib/auth";
import { parseFormDate } from "@/lib/date";
import { deriveExpenseAmount } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(text(formData, key, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function enumValue<T extends string>(value: string, values: readonly T[], fallback: T) {
  return values.includes(value as T) ? (value as T) : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function publicSlug(name: string) {
  return `${slugify(name) || "trip"}-${randomBytes(3).toString("hex")}`;
}

export async function signUpAction(formData: FormData) {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");

  if (!name || !email || password.length < 8) {
    redirect("/signup?error=Use%20a%20name,%20email,%20and%208%2B%20character%20password");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    redirect("/signup?error=That%20email%20already%20has%20an%20account");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password)
    }
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=Invalid%20email%20or%20password");
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createTripAction(formData: FormData) {
  const user = await requireUser();
  const name = text(formData, "name");
  const startDate = parseFormDate(formData.get("startDate"));
  const endDate = parseFormDate(formData.get("endDate"), startDate);
  const budgetLimit = numberValue(formData, "budgetLimit");
  const visibility = enumValue(text(formData, "visibility"), Object.values(TripVisibility), user.defaultTripVisibility);

  if (!name) {
    redirect("/trips/new?error=Trip%20name%20is%20required");
  }

  const trip = await prisma.trip.create({
    data: {
      ownerId: user.id,
      name,
      description: text(formData, "description"),
      coverPhotoUrl: text(formData, "coverPhotoUrl"),
      startDate,
      endDate,
      budgetLimit,
      visibility,
      isPublic: visibility === "PUBLIC",
      shareSlug: visibility === "PRIVATE" ? null : publicSlug(name)
    }
  });

  redirect(`/trips/${trip.id}/builder`);
}

export type ActionResult = { ok: true } | { ok: false; message: string };

export async function updateTripFormAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const tripId = text(formData, "tripId");
    const trip = await prisma.trip.findUnique({ where: { id: tripId, ownerId: user.id } });
    const visibility = enumValue(text(formData, "visibility"), Object.values(TripVisibility), "PRIVATE");

    if (!trip) {
      return { ok: false, message: "Trip not found." };
    }

    await prisma.trip.update({
      where: { id: tripId, ownerId: user.id },
      data: {
        name: text(formData, "name"),
        description: text(formData, "description"),
        coverPhotoUrl: text(formData, "coverPhotoUrl"),
        startDate: parseFormDate(formData.get("startDate")),
        endDate: parseFormDate(formData.get("endDate")),
        budgetLimit: numberValue(formData, "budgetLimit"),
        visibility,
        isPublic: visibility === "PUBLIC",
        shareSlug: visibility === "PRIVATE" ? trip.shareSlug : trip.shareSlug ?? `${slugify(trip.name)}-${trip.id.slice(-6)}`
      }
    });

    revalidatePath(`/trips/${tripId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, message: "Could not update trip. Check your inputs." };
    }
    return { ok: false, message: "Something went wrong while saving." };
  }
}

export async function deleteTripAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");

  await prisma.trip.delete({ where: { id: tripId, ownerId: user.id } });
  revalidatePath("/trips");
  redirect("/trips");
}

export async function addStopAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const cityId = text(formData, "cityId");
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    include: { stops: true }
  });

  if (!trip || !cityId) {
    redirect("/trips");
  }

  await prisma.tripStop.create({
    data: {
      tripId,
      cityId,
      position: trip.stops.length + 1,
      startDate: parseFormDate(formData.get("startDate"), trip.startDate),
      endDate: parseFormDate(formData.get("endDate"), trip.endDate),
      notes: text(formData, "notes")
    }
  });

  revalidatePath(`/trips/${tripId}/builder`);
}

export async function moveStopAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const stopId = text(formData, "stopId");
  const direction = text(formData, "direction") === "up" ? -1 : 1;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    include: { stops: { orderBy: { position: "asc" } } }
  });

  if (!trip) {
    redirect("/trips");
  }

  const index = trip.stops.findIndex((stop) => stop.id === stopId);
  const swap = trip.stops[index + direction];

  if (index >= 0 && swap) {
    await prisma.$transaction([
      prisma.tripStop.update({ where: { id: stopId }, data: { position: swap.position } }),
      prisma.tripStop.update({ where: { id: swap.id }, data: { position: trip.stops[index].position } })
    ]);
  }

  revalidatePath(`/trips/${tripId}/builder`);
}

export async function deleteStopAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const stopId = text(formData, "stopId");

  const stop = await prisma.tripStop.findFirst({
    where: { id: stopId, trip: { ownerId: user.id, id: tripId } }
  });

  if (stop) {
    await prisma.tripStop.delete({ where: { id: stopId } });
  }

  revalidatePath(`/trips/${tripId}/builder`);
}

export async function addItineraryItemAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const stopId = text(formData, "stopId");
  const activityId = text(formData, "activityId");
  const startTime = text(formData, "startTime", "10:00");
  const stop = await prisma.tripStop.findFirst({
    where: { id: stopId, trip: { id: tripId, ownerId: user.id } }
  });

  if (!stop || !activityId) {
    redirect(`/trips/${tripId}/builder`);
  }

  await prisma.itineraryItem.create({
    data: {
      stopId,
      activityId,
      date: parseFormDate(formData.get("date"), stop.startDate),
      startTime,
      notes: text(formData, "notes")
    }
  });

  revalidatePath(`/trips/${tripId}/builder`);
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteItineraryItemAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const itemId = text(formData, "itemId");
  const item = await prisma.itineraryItem.findFirst({
    where: { id: itemId, stop: { trip: { id: tripId, ownerId: user.id } } }
  });

  if (item) {
    await prisma.itineraryItem.delete({ where: { id: itemId } });
  }

  revalidatePath(`/trips/${tripId}/builder`);
  revalidatePath(`/trips/${tripId}`);
}

export async function addExpenseAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const category = text(formData, "category") as BudgetCategory;
  const quantity = Math.max(numberValue(formData, "quantity", 1), 1);
  const unitCost = numberValue(formData, "unitCost");
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    select: { id: true }
  });

  if (!trip) {
    redirect("/trips");
  }

  await prisma.tripExpense.create({
    data: {
      tripId,
      category,
      label: text(formData, "label"),
      amount: deriveExpenseAmount(quantity, unitCost),
      vendor: text(formData, "vendor") || null,
      quantity,
      unitCost,
      paidStatus: enumValue(text(formData, "paidStatus"), Object.values(PaymentStatus), "UNPAID"),
      receiptUrl: text(formData, "receiptUrl") || null,
      date: parseFormDate(formData.get("date"))
    }
  });

  revalidatePath(`/trips/${tripId}/budget`);
}

export async function deleteExpenseAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const expenseId = text(formData, "expenseId");

  await prisma.tripExpense.delete({ where: { id: expenseId, trip: { ownerId: user.id } } });
  revalidatePath(`/trips/${tripId}/budget`);
}

export async function addChecklistItemAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    select: { id: true }
  });

  if (!trip) {
    redirect("/trips");
  }

  await prisma.packingItem.create({
    data: {
      tripId,
      title: text(formData, "title"),
      category: text(formData, "category") as ChecklistCategory
    }
  });

  revalidatePath(`/trips/${tripId}/checklist`);
}

export async function toggleChecklistItemAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const itemId = text(formData, "itemId");
  const item = await prisma.packingItem.findFirst({
    where: { id: itemId, trip: { ownerId: user.id, id: tripId } }
  });

  if (item) {
    await prisma.packingItem.update({
      where: { id: itemId },
      data: { isPacked: !item.isPacked }
    });
  }

  revalidatePath(`/trips/${tripId}/checklist`);
}

export async function deleteChecklistItemAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const itemId = text(formData, "itemId");

  await prisma.packingItem.delete({ where: { id: itemId, trip: { ownerId: user.id } } });
  revalidatePath(`/trips/${tripId}/checklist`);
}

export async function addNoteAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const stopId = text(formData, "stopId") || null;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, ownerId: user.id },
    select: { id: true }
  });

  if (!trip) {
    redirect("/trips");
  }

  await prisma.tripNote.create({
    data: {
      tripId,
      stopId,
      title: text(formData, "title"),
      body: text(formData, "body")
    }
  });

  revalidatePath(`/trips/${tripId}/notes`);
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteNoteAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const noteId = text(formData, "noteId");

  await prisma.tripNote.delete({ where: { id: noteId, trip: { ownerId: user.id } } });
  revalidatePath(`/trips/${tripId}/notes`);
  revalidatePath(`/trips/${tripId}`);
}

export async function publishTripAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const trip = await prisma.trip.findUnique({ where: { id: tripId, ownerId: user.id } });

  if (!trip) {
    redirect("/trips");
  }

  const shareSlug = trip.shareSlug ?? `${slugify(trip.name)}-${trip.id.slice(-6)}`;

  await prisma.trip.update({
    where: { id: tripId, ownerId: user.id },
    data: {
      isPublic: true,
      visibility: "PUBLIC",
      shareSlug
    }
  });

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}?toast=published`);
}

export async function unpublishTripAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");

  await prisma.trip.update({
    where: { id: tripId, ownerId: user.id },
    data: { isPublic: false, visibility: "PRIVATE" }
  });

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}?toast=private`);
}

export async function updateTripVisibilityAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const visibility = enumValue(text(formData, "visibility"), Object.values(TripVisibility), "PRIVATE");
  const trip = await prisma.trip.findUnique({ where: { id: tripId, ownerId: user.id } });

  if (!trip) {
    redirect("/trips");
  }

  await prisma.trip.update({
    where: { id: tripId, ownerId: user.id },
    data: {
      visibility,
      isPublic: visibility === "PUBLIC",
      shareSlug: visibility === "PRIVATE" ? trip.shareSlug : trip.shareSlug ?? `${slugify(trip.name)}-${trip.id.slice(-6)}`
    }
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/community");
}

export async function updateProfileFormAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const email = text(formData, "email").toLowerCase();
    const visibility = enumValue(text(formData, "defaultTripVisibility"), Object.values(TripVisibility), "PRIVATE");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: text(formData, "name"),
        email,
        photoUrl: text(formData, "photoUrl") || null,
        phone: text(formData, "phone") || null,
        bio: text(formData, "bio") || null,
        homeCity: text(formData, "homeCity") || null,
        homeCountry: text(formData, "homeCountry") || null,
        language: text(formData, "language", "en") || "en",
        defaultTripVisibility: visibility
      }
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "That email is already in use." };
    }
    return { ok: false, message: "Could not save profile. Try again." };
  }
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const currentPassword = text(formData, "currentPassword");
  const nextPassword = text(formData, "nextPassword");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!dbUser || !(await verifyPassword(currentPassword, dbUser.passwordHash)) || nextPassword.length < 8) {
    redirect("/settings?password=invalid");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(nextPassword) }
  });

  redirect("/settings?password=updated");
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  const confirmation = text(formData, "confirmation").toLowerCase();

  if (confirmation !== user.email.toLowerCase()) {
    redirect("/settings?delete=confirm-email");
  }

  await prisma.user.delete({ where: { id: user.id } });
  await clearSession();
  redirect("/signup");
}

export async function toggleLikeTripAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, moderationStatus: "ACTIVE", OR: [{ visibility: "PUBLIC" }, { isPublic: true }] },
    select: { id: true }
  });

  if (!trip) {
    redirect("/community");
  }

  const existing = await prisma.tripLike.findUnique({ where: { userId_tripId: { userId: user.id, tripId } } });

  if (existing) {
    await prisma.tripLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.tripLike.create({ data: { userId: user.id, tripId } });
  }

  revalidatePath("/community");
  revalidatePath(`/trips/${tripId}`);
}

export async function toggleSaveTripAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, moderationStatus: "ACTIVE", OR: [{ visibility: "PUBLIC" }, { isPublic: true }] },
    select: { id: true }
  });

  if (!trip) {
    redirect("/community");
  }

  const existing = await prisma.tripSave.findUnique({ where: { userId_tripId: { userId: user.id, tripId } } });

  if (existing) {
    await prisma.tripSave.delete({ where: { id: existing.id } });
  } else {
    await prisma.tripSave.create({ data: { userId: user.id, tripId } });
  }

  revalidatePath("/community");
  revalidatePath("/settings");
}

export async function addCommunityCommentAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const body = text(formData, "body");
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, moderationStatus: "ACTIVE", OR: [{ visibility: "PUBLIC" }, { isPublic: true }] },
    select: { id: true }
  });

  if (trip && body.length >= 2) {
    await prisma.tripComment.create({ data: { userId: user.id, tripId, body: body.slice(0, 600) } });
  }

  revalidatePath("/community");
}

export async function copyPublicTripAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const source = await prisma.trip.findFirst({
    where: { id: tripId, moderationStatus: "ACTIVE", OR: [{ visibility: "PUBLIC" }, { isPublic: true }] },
    include: {
      stops: { orderBy: { position: "asc" }, include: { itinerary: true } },
      expenses: true,
      checklistItems: true,
      notes: true
    }
  });

  if (!source) {
    redirect("/community");
  }

  const copiedTrip = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        ownerId: user.id,
        sourceTripId: source.id,
        name: `${source.name} copy`,
        description: source.description,
        startDate: source.startDate,
        endDate: source.endDate,
        coverPhotoUrl: source.coverPhotoUrl,
        budgetLimit: source.budgetLimit,
        visibility: "PRIVATE",
        isPublic: false
      }
    });
    const stopMap = new Map<string, string>();

    for (const stop of source.stops) {
      const createdStop = await tx.tripStop.create({
        data: {
          tripId: trip.id,
          cityId: stop.cityId,
          position: stop.position,
          startDate: stop.startDate,
          endDate: stop.endDate,
          notes: stop.notes,
          itinerary: {
            create: stop.itinerary.map((item) => ({
              activityId: item.activityId,
              date: item.date,
              startTime: item.startTime,
              costOverride: item.costOverride,
              notes: item.notes
            }))
          }
        }
      });
      stopMap.set(stop.id, createdStop.id);
    }

    if (source.expenses.length) {
      await tx.tripExpense.createMany({
        data: source.expenses.map((expense) => ({
          tripId: trip.id,
          stopId: expense.stopId ? stopMap.get(expense.stopId) ?? null : null,
          category: expense.category,
          label: expense.label,
          amount: expense.amount,
          vendor: expense.vendor,
          quantity: expense.quantity,
          unitCost: expense.unitCost,
          paidStatus: expense.paidStatus,
          receiptUrl: expense.receiptUrl,
          date: expense.date
        }))
      });
    }
    if (source.checklistItems.length) {
      await tx.packingItem.createMany({
        data: source.checklistItems.map((item) => ({
          tripId: trip.id,
          title: item.title,
          category: item.category,
          isPacked: false
        }))
      });
    }
    if (source.notes.length) {
      await tx.tripNote.createMany({
        data: source.notes.map((note) => ({
          tripId: trip.id,
          stopId: note.stopId ? stopMap.get(note.stopId) ?? null : null,
          title: note.title,
          body: note.body
        }))
      });
    }

    return trip;
  });

  redirect(`/trips/${copiedTrip.id}?toast=copied`);
}

export async function upsertCityAction(formData: FormData) {
  await requireAdmin();
  const cityId = text(formData, "cityId");
  const data = {
    name: text(formData, "name"),
    country: text(formData, "country"),
    region: text(formData, "region"),
    costIndex: numberValue(formData, "costIndex", 3),
    popularity: numberValue(formData, "popularity", 50),
    imageUrl: text(formData, "imageUrl"),
    summary: text(formData, "summary"),
    isFeatured: checkbox(formData, "isFeatured"),
    isArchived: checkbox(formData, "isArchived")
  };

  if (cityId) {
    await prisma.city.update({ where: { id: cityId }, data });
  } else {
    await prisma.city.create({ data });
  }

  revalidatePath("/admin/catalog");
  revalidatePath("/dashboard");
}

export async function upsertActivityAction(formData: FormData) {
  await requireAdmin();
  const activityId = text(formData, "activityId");
  const data = {
    cityId: text(formData, "cityId"),
    name: text(formData, "name"),
    category: enumValue(text(formData, "category"), Object.values(ActivityCategory), "SIGHTSEEING"),
    description: text(formData, "description"),
    durationHours: Math.max(numberValue(formData, "durationHours", 2), 1),
    estimatedCost: numberValue(formData, "estimatedCost"),
    imageUrl: text(formData, "imageUrl"),
    tags: text(formData, "tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    isFeatured: checkbox(formData, "isFeatured"),
    isArchived: checkbox(formData, "isArchived")
  };

  if (activityId) {
    await prisma.activity.update({ where: { id: activityId }, data });
  } else {
    await prisma.activity.create({ data });
  }

  revalidatePath("/admin/catalog");
  revalidatePath("/community");
}

export async function completeTutorialAction() {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hasCompletedOnboarding: true,
      tutorialStep: 0
    }
  });

  revalidatePath("/dashboard");
}

export async function restartTutorialAction() {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hasCompletedOnboarding: false,
      tutorialStep: 0
    }
  });

  revalidatePath("/dashboard");
}

export async function reportTripAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const reason = text(formData, "reason", "Misleading or invalid itinerary");
  const details = text(formData, "details");
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, moderationStatus: "ACTIVE", OR: [{ visibility: "PUBLIC" }, { isPublic: true }] },
    select: { id: true }
  });

  if (trip) {
    await prisma.tripReport.create({
      data: {
        tripId,
        reporterId: user.id,
        reason,
        details: details || null
      }
    });
  }

  revalidatePath("/community");
}

export async function reportCommentAction(formData: FormData) {
  const user = await requireUser();
  const commentId = text(formData, "commentId");
  const reason = text(formData, "reason", "Inappropriate or misleading comment");
  const details = text(formData, "details");
  const comment = await prisma.tripComment.findFirst({
    where: {
      id: commentId,
      moderationStatus: "ACTIVE",
      trip: { moderationStatus: "ACTIVE", OR: [{ visibility: "PUBLIC" }, { isPublic: true }] }
    },
    select: { id: true }
  });

  if (comment) {
    await prisma.commentReport.create({
      data: {
        commentId,
        reporterId: user.id,
        reason,
        details: details || null
      }
    });
  }

  revalidatePath("/community");
}

export async function hideCommentAction(formData: FormData) {
  const admin = await requireAdmin();
  const commentId = text(formData, "commentId");
  const reason = text(formData, "reason", "Hidden by admin moderation");

  await prisma.tripComment.update({
    where: { id: commentId },
    data: {
      moderationStatus: "HIDDEN",
      moderationReason: reason,
      moderatedAt: new Date(),
      moderatedById: admin.id
    }
  });

  revalidatePath("/community");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
}

export async function deleteCommentAction(formData: FormData) {
  await requireAdmin();
  const commentId = text(formData, "commentId");

  await prisma.tripComment.delete({ where: { id: commentId } });
  revalidatePath("/community");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
}

export async function takeDownTripAction(formData: FormData) {
  const admin = await requireAdmin();
  const tripId = text(formData, "tripId");
  const reason = text(formData, "reason", "Taken down by admin moderation");

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      moderationStatus: "TAKEN_DOWN",
      moderationReason: reason,
      moderatedAt: new Date(),
      moderatedById: admin.id
    }
  });

  revalidatePath("/community");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
}

export async function restoreTripAction(formData: FormData) {
  const admin = await requireAdmin();
  const tripId = text(formData, "tripId");

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      moderationStatus: "ACTIVE",
      moderationReason: null,
      moderatedAt: new Date(),
      moderatedById: admin.id
    }
  });

  revalidatePath("/community");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
}

export async function resolveReportAction(formData: FormData) {
  const admin = await requireAdmin();
  const reportType = text(formData, "reportType");
  const reportId = text(formData, "reportId");
  const status = enumValue(text(formData, "status"), Object.values(ReportStatus), "RESOLVED");
  const resolutionNotes = text(formData, "resolutionNotes");
  const data = {
    status,
    resolutionNotes: resolutionNotes || null,
    resolvedAt: new Date(),
    resolvedById: admin.id
  };

  if (reportType === "comment") {
    await prisma.commentReport.update({ where: { id: reportId }, data });
  } else {
    await prisma.tripReport.update({ where: { id: reportId }, data });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
}
