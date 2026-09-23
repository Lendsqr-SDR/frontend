export const today = () => {
  const dt = new Date();
  dt.setHours(0, 0, 0, 0);
  return dt;
};

export const todayISO = () => today().toISOString().slice(0, 10);

export const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const dt = new Date(iso + "T00:00:00");
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", yyyy: undefined, year: "numeric" } as Intl.DateTimeFormatOptions);
};

export const daysFromToday = (iso: string | null) => {
  if (!iso) return null;
  const dt = new Date(iso + "T00:00:00");
  return Math.round((dt.getTime() - today().getTime()) / 86400000);
};

export const relativeDay = (iso: string | null) => {
  const diff = daysFromToday(iso);
  if (diff === null) return "—";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
};
