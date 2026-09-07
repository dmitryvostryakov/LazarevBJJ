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

// Mini-group session is priced as one pool split between participants.
// 2 человека = 5500 каждый (11000 за сессию) — дальше цена за место снижается пропорционально размеру группы.
const GROUP_SESSION_POOL = 11000;

export function getPrice({ format, audience, groupSize }) {
  if (format === 'personal') {
    return PERSONAL_PRICE[audience] ?? PERSONAL_PRICE.adults;
  }
  const size = groupSize || GROUP_SIZES[0];
  return Math.ceil(GROUP_SESSION_POOL / size / 50) * 50;
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
