import { and, eq, gte, isNull, inArray, lte } from "drizzle-orm";
import { addMinutes, differenceInMinutes, startOfMinute } from "date-fns";
import webpush from "web-push";
import { db } from "../db/client";
import {
  matchPlans,
  watchlists,
  userSubscriptions,
  matchReminderLogs,
  matchParticipants,
  teams,
  eventBlocks,
  events,
} from "../db/schema";

webpush.setVapidDetails(
  process.env.MAIL_ADDRESS!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendMatchReminders() {
  const now = new Date();
  const from = addMinutes(now, 5);
  const to = addMinutes(now, 10);

  try {
    const rawTargets = await db
      .select({
        matchId: matchPlans.id,
        matchName: matchPlans.name,
        matchDescription: matchPlans.description,
        scheduledStartTime: matchPlans.scheduledStartTime,
        eventName: events.name,
        blockName: eventBlocks.name,
        subscriptionId: userSubscriptions.id,
        endpoint: userSubscriptions.endpoint,
        p256dh: userSubscriptions.p256dh,
        auth: userSubscriptions.auth,
      })
      .from(matchPlans)
      .innerJoin(eventBlocks, eq(matchPlans.eventBlockId, eventBlocks.id))
      .innerJoin(events, eq(eventBlocks.eventId, events.id))
      .innerJoin(watchlists, eq(watchlists.matchPlanId, matchPlans.id))
      .innerJoin(userSubscriptions, eq(watchlists.userSubscriptionId, userSubscriptions.id))
      .leftJoin(
        matchReminderLogs,
        and(
          eq(matchReminderLogs.matchPlanId, matchPlans.id),
          eq(matchReminderLogs.userSubscriptionId, userSubscriptions.id)
        )
      )
      .where(
        and(
          gte(matchPlans.scheduledStartTime, from),
          lte(matchPlans.scheduledStartTime, to),
          eq(matchPlans.status, "Waiting"),
          isNull(matchReminderLogs.matchPlanId)
        )
      );

    if (rawTargets.length === 0) {
      return;
    }

    const matchIds = Array.from(new Set(rawTargets.map((t) => t.matchId)));

    const participantRows = await db
      .select({
        matchPlanId: matchParticipants.matchPlanId,
        teamName: teams.name,
      })
      .from(matchParticipants)
      .innerJoin(teams, eq(matchParticipants.teamId, teams.id))
      .where(inArray(matchParticipants.matchPlanId, matchIds));

    const matchTeamsMap = new Map<number, string[]>();
    for (const row of participantRows) {
      if (!matchTeamsMap.has(row.matchPlanId)) {
        matchTeamsMap.set(row.matchPlanId, []);
      }
      matchTeamsMap.get(row.matchPlanId)!.push(row.teamName);
    }

    for (const target of rawTargets) {
      const minutesLeft = differenceInMinutes(
        startOfMinute(target.scheduledStartTime),
        startOfMinute(now)
      );

      const fetchedTeams = matchTeamsMap.get(target.matchId) || [];
      const matchVersus = fetchedTeams.length >= 2
        ? fetchedTeams.join(" vs ")
        : "対戦相手未定";

      const eventDisplay = target.matchDescription ?? `${target.eventName} ${target.blockName}`;

      const matchNumberDisplay = target.matchName ? ` (${target.matchName})` : "";

      try {
        await webpush.sendNotification(
          {
            endpoint: target.endpoint,
            keys: { p256dh: target.p256dh, auth: target.auth },
          },
          JSON.stringify({
            title: `試合開始まであと${minutesLeft}分！`,
            body: `【${matchVersus}】${eventDisplay} がまもなく開始します${matchNumberDisplay}`,
            url: `/match/${target.matchId}`,
          }),
            {
                headers: {
                    'Urgency': 'high',
                }
            }
        );

        await db
          .insert(matchReminderLogs)
          .values({
            matchPlanId: target.matchId,
            userSubscriptionId: target.subscriptionId,
          })
          .onConflictDoNothing();

      } catch (err: any) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          await db
            .delete(userSubscriptions)
            .where(eq(userSubscriptions.id, target.subscriptionId));
        } else {
          const statusCode = err?.statusCode || 'Unknown';
          const errorBody = err?.body || err?.message || 'No specific error body provided';

          console.error(
            `[ERROR][Push] Notification failure for Subscription ID: ${target.subscriptionId}\n` +
            `  - Endpoint: ${target.endpoint}\n` +
            `  - Status Code: ${statusCode}\n` +
            `  - Details: ${errorBody}`)
        }
      }
    }
  } catch (error) {
    console.error(
      "[ERROR][Push] Fatal error in sendMatchReminders service:\n",
      error instanceof Error ? error.stack || error.message : error
    );
  }
}
