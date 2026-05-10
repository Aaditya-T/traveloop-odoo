"use server";

import { BudgetCategory, ChecklistCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { parseFormDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(text(formData, key, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
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
      budgetLimit
    }
  });

  redirect(`/trips/${trip.id}/builder`);
}

export async function updateTripAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");

  await prisma.trip.update({
    where: { id: tripId, ownerId: user.id },
    data: {
      name: text(formData, "name"),
      description: text(formData, "description"),
      coverPhotoUrl: text(formData, "coverPhotoUrl"),
      startDate: parseFormDate(formData.get("startDate")),
      endDate: parseFormDate(formData.get("endDate")),
      budgetLimit: numberValue(formData, "budgetLimit")
    }
  });

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
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
      amount: numberValue(formData, "amount"),
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
}

export async function deleteNoteAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const noteId = text(formData, "noteId");

  await prisma.tripNote.delete({ where: { id: noteId, trip: { ownerId: user.id } } });
  revalidatePath(`/trips/${tripId}/notes`);
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
      shareSlug
    }
  });

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function unpublishTripAction(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");

  await prisma.trip.update({
    where: { id: tripId, ownerId: user.id },
    data: { isPublic: false }
  });

  revalidatePath(`/trips/${tripId}`);
}
