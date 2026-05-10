import { CheckCircle2, Flag, MessageSquare, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import {
  deleteCommentAction,
  hideCommentAction,
  resolveReportAction,
  restoreTripAction,
  takeDownTripAction
} from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

function ModerationReasonInput({ name = "reason", placeholder = "Reason for this moderation action" }: { name?: string; placeholder?: string }) {
  return <input className="input min-h-9 py-1 text-xs" name={name} placeholder={placeholder} />;
}

function ReportResolutionForm({
  reportId,
  reportType,
  status,
  label
}: {
  reportId: string;
  reportType: "trip" | "comment";
  status: "RESOLVED" | "DISMISSED";
  label: string;
}) {
  return (
    <form action={resolveReportAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <input name="reportId" type="hidden" value={reportId} />
      <input name="reportType" type="hidden" value={reportType} />
      <input name="status" type="hidden" value={status} />
      <input className="input min-h-9 py-1 text-xs" name="resolutionNotes" placeholder="Resolution note" />
      <button className="btn-ghost min-h-9 py-1 text-xs" type="submit">
        <CheckCircle2 className="h-4 w-4" />
        {label}
      </button>
    </form>
  );
}

export default async function AdminModerationPage() {
  await requireAdmin();

  const [tripReports, commentReports, publicTrips, comments] = await Promise.all([
    prisma.tripReport.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { name: true, email: true } },
        trip: { include: { owner: { select: { name: true, email: true } } } }
      },
      take: 20
    }),
    prisma.commentReport.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { name: true, email: true } },
        comment: {
          include: {
            user: { select: { name: true, email: true } },
            trip: { select: { id: true, name: true, shareSlug: true, moderationStatus: true } }
          }
        }
      },
      take: 20
    }),
    prisma.trip.findMany({
      where: { OR: [{ visibility: "PUBLIC" }, { isPublic: true }] },
      orderBy: [{ moderationStatus: "desc" }, { updatedAt: "desc" }],
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { comments: true, reports: true, likes: true, saves: true } }
      },
      take: 30
    }),
    prisma.tripComment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        trip: { select: { id: true, name: true, shareSlug: true, moderationStatus: true } },
        _count: { select: { reports: true } }
      },
      take: 30
    })
  ]);

  const pendingCount = tripReports.length + commentReports.length;

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Admin moderation</p>
          <h1 className="text-4xl font-black text-ink">Keep the public atlas clean</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
            Review reports, hide bad comments, and take down misleading public trips without deleting traveller work.
          </p>
        </div>
        <Link className="btn-ghost" href="/admin">Back to admin</Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="sketch-panel bg-ticket p-5">
          <Flag className="h-6 w-6" />
          <p className="mt-4 text-sm font-black uppercase">Pending reports</p>
          <p className="mt-2 text-4xl font-black">{pendingCount}</p>
        </article>
        <article className="sketch-panel bg-white p-5">
          <ShieldAlert className="h-6 w-6 text-coral" />
          <p className="mt-4 text-sm font-black uppercase">Public trips watched</p>
          <p className="mt-2 text-4xl font-black">{publicTrips.length}</p>
        </article>
        <article className="sketch-panel bg-lagoon p-5 text-white">
          <MessageSquare className="h-6 w-6" />
          <p className="mt-4 text-sm font-black uppercase">Recent comments</p>
          <p className="mt-2 text-4xl font-black">{comments.length}</p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="sketch-panel grid gap-4 p-5">
          <h2 className="text-2xl font-black">Trip reports</h2>
          {tripReports.map((report) => (
            <article key={report.id} className="grid gap-3 border-b-2 border-ink/10 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{report.trip.name}</p>
                  <p className="text-xs font-bold text-ink/60">Owner: {report.trip.owner.name} - Reporter: {report.reporter.name}</p>
                </div>
                <span className="stamp">{report.reason}</span>
              </div>
              {report.details ? <p className="text-sm leading-6 text-ink/70">{report.details}</p> : null}
              <div className="grid gap-2">
                <form action={takeDownTripAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input name="tripId" type="hidden" value={report.tripId} />
                  <ModerationReasonInput placeholder="Takedown reason" />
                  <button className="btn-primary min-h-9 py-1 text-xs" type="submit">
                    <ShieldAlert className="h-4 w-4" />
                    Take down
                  </button>
                </form>
                <ReportResolutionForm label="Resolve" reportId={report.id} reportType="trip" status="RESOLVED" />
                <ReportResolutionForm label="Dismiss" reportId={report.id} reportType="trip" status="DISMISSED" />
              </div>
            </article>
          ))}
          {tripReports.length === 0 ? <p className="text-sm text-ink/60">No pending trip reports.</p> : null}
        </div>

        <div className="sketch-panel grid gap-4 p-5">
          <h2 className="text-2xl font-black">Comment reports</h2>
          {commentReports.map((report) => (
            <article key={report.id} className="grid gap-3 border-b-2 border-ink/10 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{report.comment.trip.name}</p>
                  <p className="text-xs font-bold text-ink/60">By {report.comment.user.name} - Reporter: {report.reporter.name}</p>
                </div>
                <span className="stamp">{report.reason}</span>
              </div>
              <blockquote className="border-l-4 border-coral bg-paper px-3 py-2 text-sm leading-6 text-ink/75">{report.comment.body}</blockquote>
              {report.details ? <p className="text-sm leading-6 text-ink/70">{report.details}</p> : null}
              <div className="grid gap-2">
                <form action={hideCommentAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input name="commentId" type="hidden" value={report.commentId} />
                  <ModerationReasonInput placeholder="Hide reason" />
                  <button className="btn-primary min-h-9 py-1 text-xs" type="submit">
                    <ShieldAlert className="h-4 w-4" />
                    Hide
                  </button>
                </form>
                <form action={deleteCommentAction}>
                  <input name="commentId" type="hidden" value={report.commentId} />
                  <button className="btn-ghost min-h-9 py-1 text-xs text-coral" type="submit">
                    <Trash2 className="h-4 w-4" />
                    Delete comment
                  </button>
                </form>
                <ReportResolutionForm label="Resolve" reportId={report.id} reportType="comment" status="RESOLVED" />
                <ReportResolutionForm label="Dismiss" reportId={report.id} reportType="comment" status="DISMISSED" />
              </div>
            </article>
          ))}
          {commentReports.length === 0 ? <p className="text-sm text-ink/60">No pending comment reports.</p> : null}
        </div>
      </section>

      <section className="sketch-panel grid gap-4 p-5">
        <h2 className="text-2xl font-black">Public trip moderation</h2>
        <div className="grid gap-3">
          {publicTrips.map((trip) => (
            <article key={trip.id} className="grid gap-3 border-b-2 border-ink/10 pb-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">{trip.name}</p>
                  <span className="stamp">{trip.moderationStatus.toLowerCase().replace("_", " ")}</span>
                </div>
                <p className="mt-1 text-xs font-bold text-ink/60">
                  {trip.owner.name} - {trip._count.likes} likes - {trip._count.saves} saves - {trip._count.comments} comments - {trip._count.reports} reports
                </p>
                {trip.moderationReason ? <p className="mt-2 text-sm text-coral">{trip.moderationReason}</p> : null}
              </div>
              {trip.moderationStatus === "ACTIVE" ? (
                <form action={takeDownTripAction} className="grid min-w-72 gap-2 sm:grid-cols-[1fr_auto]">
                  <input name="tripId" type="hidden" value={trip.id} />
                  <ModerationReasonInput placeholder="Takedown reason" />
                  <button className="btn-primary min-h-9 py-1 text-xs" type="submit">Take down</button>
                </form>
              ) : (
                <form action={restoreTripAction}>
                  <input name="tripId" type="hidden" value={trip.id} />
                  <button className="btn-secondary min-h-9 py-1 text-xs" type="submit">
                    <Undo2 className="h-4 w-4" />
                    Restore
                  </button>
                </form>
              )}
            </article>
          ))}
          {publicTrips.length === 0 ? <p className="text-sm text-ink/60">No public trips yet.</p> : null}
        </div>
      </section>

      <section className="sketch-panel grid gap-4 p-5">
        <h2 className="text-2xl font-black">Recent comment moderation</h2>
        <div className="grid gap-3">
          {comments.map((comment) => (
            <article key={comment.id} className="grid gap-3 border-b-2 border-ink/10 pb-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black">{comment.user.name} on {comment.trip.name}</p>
                  <span className="stamp">{comment.moderationStatus.toLowerCase()}</span>
                </div>
                <p className="mt-1 text-xs font-bold text-ink/60">{formatDate(comment.createdAt)} - {comment._count.reports} reports</p>
                <p className="mt-2 text-sm leading-6 text-ink/75">{comment.body}</p>
                {comment.moderationReason ? <p className="mt-2 text-sm text-coral">{comment.moderationReason}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {comment.moderationStatus === "ACTIVE" ? (
                  <form action={hideCommentAction} className="flex gap-2">
                    <input name="commentId" type="hidden" value={comment.id} />
                    <input name="reason" type="hidden" value="Hidden from recent moderation" />
                    <button className="btn-ghost min-h-9 py-1 text-xs" type="submit">Hide</button>
                  </form>
                ) : null}
                <form action={deleteCommentAction}>
                  <input name="commentId" type="hidden" value={comment.id} />
                  <button className="btn-ghost min-h-9 py-1 text-xs text-coral" type="submit">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </form>
              </div>
            </article>
          ))}
          {comments.length === 0 ? <p className="text-sm text-ink/60">No community comments yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
