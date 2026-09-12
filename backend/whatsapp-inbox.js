"use strict";
const crypto = require("crypto");

// Persist before acknowledging. Only pending messages are safe to replay after a
// restart; a process dying inside a handler needs reconciliation, not a resend.
function createWhatsappInbox({ collection, process, log }) {
  const inbox = () => collection("whatsapp_inbox");
  const locks = () => collection("whatsapp_phone_locks");
  const canonicalPhone = value => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length === 10 ? `91${digits}` : digits;
  };
  return {
    async persist(messages) {
      for (const message of messages) {
        try { await inbox().updateOne({ eventId: message.id }, { $setOnInsert: {
          eventId: message.id, phone: canonicalPhone(message.from), message,
          status: "pending", receivedAt: new Date(),
        } }, { upsert: true }); }
        catch (error) { if (error.code !== 11000) throw error; }
      }
    },
    async run(message) {
      const phone = canonicalPhone(message.from), owner = crypto.randomUUID();
      let lease;
      try {
        lease = await locks().findOneAndUpdate({ phone, expiresAt: { $lte: new Date() } }, {
          $set: { owner, expiresAt: new Date(Date.now() + 120000) }, $setOnInsert: { phone },
        }, { upsert: true, returnDocument: "after" });
      } catch (error) { if (error.code === 11000) return; throw error; }
      if (!lease) return;
      const heartbeat = setInterval(() => {
        void locks().updateOne({ phone, owner }, { $set: { expiresAt: new Date(Date.now() + 120000) } }).catch(() => {});
      }, 30000);
      heartbeat.unref();
      try {
        const claim = await inbox().findOneAndUpdate({ eventId: message.id, status: "pending" }, {
          $set: { status: "processing", startedAt: new Date(), owner },
        }, { returnDocument: "after" });
        if (!claim) return;
        try {
          await process({ ...message, from: phone });
          await inbox().updateOne({ eventId: message.id, owner }, { $set: { status: "completed", completedAt: new Date() } });
        } catch (error) {
          await inbox().updateOne({ eventId: message.id, owner }, { $set: { status: "needs_review", errorCode: error.code || "handler_failed" } });
          throw error;
        }
      } finally {
        clearInterval(heartbeat);
        await locks().updateOne({ phone, owner }, { $set: { expiresAt: new Date(0) } });
      }
    },
    async pending() {
      const stale = await inbox().find({ status: "processing", startedAt: { $lt: new Date(Date.now() - 120000) } }).limit(100).toArray();
      for (const row of stale) {
        const live = await locks().findOne({ phone: row.phone, owner: row.owner, expiresAt: { $gt: new Date() } });
        if (!live) {
          await inbox().updateOne({ eventId: row.eventId, status: "processing" }, { $set: { status: "needs_review", reason: "handler_interrupted" } });
          log("[WHATSAPP][INBOUND_NEEDS_REVIEW]", { messageId: row.eventId, reason: "handler_interrupted" });
        }
      }
      return (await inbox().find({ status: "pending" }).sort({ receivedAt: 1 }).limit(100).toArray()).map(row => row.message);
    },
  };
}
module.exports = { createWhatsappInbox };
