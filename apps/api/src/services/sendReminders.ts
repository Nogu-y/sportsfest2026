import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { addMinutes } from "date-fns";
import webpush from "web-push";
import { db } from "../db/client";
import {
  matchPlans,
  watchlists,
  userSubscriptions,
  matchReminderLogs,
} from "../db/schema";

webpush.setVapidDetails(
  process.env.MAIL_ADDRESS!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendMatchReminders() {
  const now = new Date();

  // 検索範囲。11分の時にうまくいくとは限らないから、身限りとして5まで値を決めてやう
  const from = addMinutes(now, 5);
  const to = addMinutes(now, 11);

  try {
    const rawTargets = await db
      .select({
        matchId: matchPlans.id,
        matchName: matchPlans.name,
        matchDescription: matchPlans.description,
        subscriptionId: userSubscriptions.id,
        endpoint: userSubscriptions.endpoint,
        p256dh: userSubscriptions.p256dh,
        auth: userSubscriptions.auth,
      })
      .from(matchPlans)
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
          lt(matchPlans.scheduledStartTime, to),
          eq(matchPlans.status, "Waiting"),
          isNull(matchReminderLogs.matchPlanId)
        )
      );

    if (rawTargets.length === 0) {
      return;
    }

    for (const target of rawTargets) {
      try {
        await webpush.sendNotification(
          {
            endpoint: target.endpoint,
            keys: { p256dh: target.p256dh, auth: target.auth },
          },
          JSON.stringify({
            title: "試合開始まもなく",
            body: `${target.matchDescription ?? target.matchName} がまもなく開始します`,
            url: `/matches/${target.matchId}`,
          })
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
          console.error(
            `[Push] Temporary failure for Subscription ID: ${target.subscriptionId}. Will retry in the next minute.`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in sendMatchReminders service:", error);
  }
}
