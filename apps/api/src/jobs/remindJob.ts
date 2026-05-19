import cron from "node-cron";
import { sendMatchReminders } from "../services/sendReminders";

// 毎分実行する設定
cron.schedule("* * * * *", async () => {
  console.log("[cron] Executing sendMatchReminders...");
  await sendMatchReminders();
});
