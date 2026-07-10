export const FOLLOWUP_DAYS = 4;

export function needsFollowUp(entry) {
  if (!entry.sentAt) return false;
  if (entry.opened) return false;
  if (entry.followUpDismissed) return false;
  if (entry.followUpSentAt) return false;
  const days = (Date.now() - new Date(entry.sentAt)) / (1000 * 60 * 60 * 24);
  return days >= FOLLOWUP_DAYS;
}

export function daysSince(isoDate) {
  return Math.floor((Date.now() - new Date(isoDate)) / (1000 * 60 * 60 * 24));
}

export function getFollowUpQueue(contacts) {
  const items = [];
  for (const contact of contacts) {
    for (const entry of (contact.emailHistory || [])) {
      if (needsFollowUp(entry)) {
        items.push({ contact, entry });
      }
    }
  }
  return items.sort((a, b) => new Date(a.entry.sentAt) - new Date(b.entry.sentAt));
}

export function groupByCampaign(contacts) {
  const campaigns = {};
  for (const contact of contacts) {
    for (const entry of (contact.emailHistory || [])) {
      const key = entry.bulkId || entry.campaignId;
      if (!key) continue;
      if (!campaigns[key]) {
        campaigns[key] = {
          key,
          label:       entry.bulkLabel || entry.subject,
          subject:     entry.subject,
          sentAt:      entry.sentAt,
          journeyType: entry.journeyType,
          isBulk:      !!entry.bulkId,
          recipients:  [],
        };
      }
      campaigns[key].recipients.push({ contact, entry });
    }
  }
  return Object.values(campaigns).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
}
