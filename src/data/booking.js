export const FORMATS = [
  { id: 'personal', label: 'Персональная' },
  { id: 'group', label: 'Мини-группа (2–4 человека)' },
];

export const AUDIENCES = {
  personal: [
    { id: 'kids', label: 'Детская' },
    { id: 'adults', label: 'Взрослая' },
  ],
  group: [
    { id: 'adults', label: 'Взрослые' },
    { id: 'kids', label: 'Дети' },
    { id: 'mixed', label: 'Взрослые и дети' },
  ],
};

export const GROUP_SIZES = [2, 3, 4];

export const GYMS = [
  { id: 'bern', label: 'Bern, Автозаводская' },
  { id: 'gmgym', label: 'GM Gym, ул. 1905 года' },
];

const PERSONAL_PRICE = { kids: 4000, adults: 4500 };

// Mini-group price is a fixed per-person rate regardless of group size
// (2, 3 or 4 человека — всегда 2750₽ с каждого).
const GROUP_PRICE_PER_HEAD = 2750;

export function getPrice({ format, audience, groupSize }) {
  if (format === 'personal') {
    return PERSONAL_PRICE[audience] ?? PERSONAL_PRICE.adults;
  }
  return GROUP_PRICE_PER_HEAD;
}

const WEEKDAY_LABELS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

// Возвращает ближайшие N реальных дат (сегодня+1 .. +30 дней), с корректной меткой дня недели.
export function getAvailableDates(daysAhead = 30) {
  const dates = [];
  const now = new Date();
  for (let i = 1; i <= daysAhead; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push({
      value: `${yyyy}-${mm}-${dd}`,
      label: `${dd}.${mm} (${WEEKDAY_LABELS[d.getDay()]})`,
    });
  }
  return dates;
}
