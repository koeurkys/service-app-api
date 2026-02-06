import cron from "cron";
import https from "https";

const API_URL = process.env.API_URL || "https://service-app-api-lwm3.onrender.com/api/health";

const job = new cron.CronJob("*/14 * * * *", function () {
  console.log("🔄 Cron job running - keeping server alive...");
  
  https
    .get(API_URL, (res) => {
      if (res.statusCode === 200) {
        console.log("✅ Keep-alive request sent successfully");
      } else {
        console.log("⚠️ Keep-alive request failed - Status:", res.statusCode);
      }
    })
    .on("error", (e) => {
      console.error("❌ Error while sending keep-alive request:", e.message);
    });
});

export default job;