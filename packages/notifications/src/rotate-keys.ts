import { db, alertSettings } from "@steady-state/db";
import { encrypt, decrypt } from "./crypto.js";
import { eq } from "drizzle-orm";

async function rotateKeys() {
  console.log("Starting Security Key Rotation...");

  try {
    const allSettings = await db.select().from(alertSettings);
    console.log(`Found ${allSettings.length} alert settings records.`);

    let updatedCount = 0;

    for (const settings of allSettings) {
      const { userId, slackWebhookUrl, telegramBotToken } = settings;
      let needsUpdate = false;
      const updateData: Partial<typeof settings> = {};

      if (slackWebhookUrl) {
        const decrypted = decrypt(slackWebhookUrl);
        // If it was encrypted, decrypt returns plain text (no prefix).
        // If it fails to decrypt, it returns original text (with prefix).
        // If it wasn't encrypted, it returns original text (no prefix).
        
        const reEncrypted = encrypt(decrypted);
        
        if (reEncrypted !== slackWebhookUrl) {
          updateData.slackWebhookUrl = reEncrypted;
          needsUpdate = true;
        }
      }

      if (telegramBotToken) {
        const decrypted = decrypt(telegramBotToken);
        const reEncrypted = encrypt(decrypted);
        
        if (reEncrypted !== telegramBotToken) {
          updateData.telegramBotToken = reEncrypted;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        console.log(`Updating keys for user: ${userId}`);
        await db.update(alertSettings)
          .set({
            ...updateData,
            updatedAt: new Date()
          })
          .where(eq(alertSettings.userId, userId));
        updatedCount++;
      }
    }

    console.log(`Successfully rotated keys for ${updatedCount} records.`);
  } catch (error) {
    console.error("Error during key rotation:", error);
    process.exit(1);
  }
}

rotateKeys()
  .then(() => {
    console.log("Rotation completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
