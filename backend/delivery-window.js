"use strict";

const INDIA_TIME_ZONE = "Asia/Kolkata";
const indiaClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: INDIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getDeliveryWindow(now, timing) {
  const parts = Object.fromEntries(
    indiaClock.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const withinHours = minutes >= 11 * 60 && minutes < 21 * 60;
  const configuredForOneHour = timing?.value === 1 && timing?.unit === "hours";
  const oneHourAvailable = withinHours && configuredForOneHour;
  const tomorrow = new Date(Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day) + 1,
  )).toISOString().slice(0, 10);

  return {
    timeZone: INDIA_TIME_ZONE,
    opensAt: "11:00",
    closesAt: "21:00",
    checkedAt: now.toISOString(),
    oneHourAvailable,
    reason: oneHourAvailable
      ? null
      : !configuredForOneHour
        ? "admin_delivery_setting"
        : "outside_delivery_hours",
    noticeKey: oneHourAvailable ? null : tomorrow,
  };
}

module.exports = { getDeliveryWindow };
