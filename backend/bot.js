import { Telegraf, Markup } from 'telegraf';
import {
  getBooking,
  setBookingStatus,
  listPending,
  listUpcoming,
  blockSlot,
  countActiveAtSlot,
  getBookingByToken,
  setClientChatId,
  GYMS,
  TIME_SLOTS,
} from './bookings.js';
import { createCalendarEvent, deleteCalendarEvent } from './calendar.js';

const GYM_LABELS = { bern: 'Bern, Автозаводская', gmgym: 'GM Gym, ул. 1905 года' };
const FORMAT_LABELS = { personal: 'Персональная', group: 'Мини-группа' };
const STATUS_LABELS = {
  pending: '⏳ Ожидает подтверждения',
  confirmed: '✅ Подтверждено',
  declined: '❌ Отклонено',
  cancelled: '🚫 Отменено',
};

const BTN_PENDING = '📋 Заявки';
const BTN_WEEK = '📅 Неделя';
const BTN_BLOCK = '🚫 Заблокировать слот';
const BTN_HELP = '❓ Помощь';

const mainMenu = Markup.keyboard([
  [BTN_PENDING, BTN_WEEK],
  [BTN_BLOCK, BTN_HELP],
]).resize();

function nextDays(n) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', weekday: 'short' });
    out.push({ iso, label });
  }
  return out;
}

let bot = null;

function formatBooking(b) {
  const groupProgress = b.format === 'group'
    ? ` (${countActiveAtSlot(b.gym, b.date, b.time)}/${b.group_size} чел.)`
    : '';
  const lines = [
    `#${b.id} — ${b.date} ${b.time}`,
    `${GYM_LABELS[b.gym] || b.gym}`,
    `${FORMAT_LABELS[b.format] || b.format}${groupProgress} — ${b.audience}`,
    `👤 ${b.name}, 📞 ${b.phone}`,
  ];
  if (b.message) lines.push(`💬 ${b.message}`);
  if (b.price) lines.push(`💰 ${b.price} ₽${b.group_size ? ' / чел.' : ''}`);
  return lines.join('\n');
}

function clientCancelKeyboard(booking) {
  if (!['pending', 'confirmed'].includes(booking.status)) return undefined;
  return {
    reply_markup: {
      inline_keyboard: [[{ text: '🚫 Отменить запись', callback_data: `clientcancel:${booking.id}` }]],
    },
  };
}

async function sendPending(ctx) {
  const pending = listPending();
  if (!pending.length) return ctx.reply('Нет заявок на подтверждение.');
  for (const b of pending) {
    await ctx.reply(formatBooking(b), {
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Подтвердить', callback_data: `confirm:${b.id}` },
          { text: '❌ Отклонить', callback_data: `decline:${b.id}` },
        ]],
      },
    });
  }
}

async function sendWeek(ctx) {
  const upcoming = listUpcoming();
  if (!upcoming.length) return ctx.reply('Подтверждённых тренировок нет.');
  await ctx.reply(upcoming.map(formatBooking).join('\n\n'));
}

async function sendBlockGymPicker(ctx) {
  await ctx.reply('Какой зал?', Markup.inlineKeyboard(
    GYMS.map((gym) => [Markup.button.callback(GYM_LABELS[gym] || gym, `blockgym:${gym}`)])
  ));
}

async function sendBlockDatePicker(ctx, gym) {
  const days = nextDays(7);
  const rows = [];
  for (let i = 0; i < days.length; i += 2) {
    rows.push(days.slice(i, i + 2).map((d) => Markup.button.callback(d.label, `blockdate:${gym}:${d.iso}`)));
  }
  await ctx.editMessageText(`Зал: ${GYM_LABELS[gym] || gym}\nВыбери дату:`, Markup.inlineKeyboard(rows));
}

async function sendBlockTimePicker(ctx, gym, date) {
  const rows = [];
  for (let i = 0; i < TIME_SLOTS.length; i += 3) {
    rows.push(TIME_SLOTS.slice(i, i + 3).map((t) => Markup.button.callback(t, `blocktime:${gym}:${date}:${t}`)));
  }
  await ctx.editMessageText(`Зал: ${GYM_LABELS[gym] || gym}\nДата: ${date}\nВыбери время:`, Markup.inlineKeyboard(rows));
}

// Deep link from the site: t.me/<bot>?start=<bookingId>_<cancelToken>. Anyone
// without the exact token for that booking gets nothing back.
async function handleClientStart(ctx, payload) {
  const [idStr, token] = payload.split('_');
  const booking = getBookingByToken(Number(idStr), token);
  if (!booking) return ctx.reply('Заявка не найдена или ссылка устарела.');
  setClientChatId(booking.id, ctx.chat.id);
  await ctx.reply(
    `${formatBooking(booking)}\n\n${STATUS_LABELS[booking.status] || booking.status}\n\nЯ пришлю сообщение, когда Никита подтвердит или отклонит заявку.`,
    clientCancelKeyboard(booking)
  );
}

export function initBot({ token, adminChatIds }) {
  bot = new Telegraf(token);

  function isAdmin(ctx) {
    return adminChatIds.map(String).includes(String(ctx.chat.id));
  }

  bot.start((ctx) => {
    const payload = ctx.startPayload;
    if (payload && payload.includes('_')) return handleClientStart(ctx, payload);
    if (!isAdmin(ctx)) return ctx.reply(`Доступ только для администратора. Твой chat_id: ${ctx.chat.id}`);
    ctx.reply(`Привет! Твой chat_id: ${ctx.chat.id}\n\nПользуйся кнопками внизу.`, mainMenu);
  });

  bot.hears(BTN_PENDING, (ctx) => {
    if (!isAdmin(ctx)) return;
    sendPending(ctx);
  });

  bot.hears(BTN_WEEK, (ctx) => {
    if (!isAdmin(ctx)) return;
    sendWeek(ctx);
  });

  bot.hears(BTN_BLOCK, (ctx) => {
    if (!isAdmin(ctx)) return;
    sendBlockGymPicker(ctx);
  });

  bot.hears(BTN_HELP, (ctx) => {
    if (!isAdmin(ctx)) return;
    ctx.reply(
      '📋 Заявки — новые заявки на подтверждение\n📅 Неделя — подтверждённые тренировки\n🚫 Заблокировать слот — закрыть конкретное время вручную (например, для личных дел)',
      mainMenu
    );
  });

  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data || '';
    const [action] = data.split(':');

    // Client self-service: only the chat linked to this booking (via the
    // deep-link /start above) may cancel it — no admin rights required.
    if (action === 'clientcancel') {
      const [, idStr] = data.split(':');
      const id = Number(idStr);
      const booking = getBooking(id);
      if (!booking || String(booking.client_chat_id) !== String(ctx.chat.id)) {
        return ctx.answerCbQuery('Не найдено');
      }
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return ctx.answerCbQuery('Уже нельзя отменить');
      }
      if (booking.calendar_event_id) {
        try {
          await deleteCalendarEvent(booking.calendar_event_id);
        } catch (err) {
          console.error('Calendar event deletion failed:', err.message);
        }
      }
      const updated = setBookingStatus(id, 'cancelled', null);
      await ctx.editMessageText(`${formatBooking(updated)}\n\n🚫 ОТМЕНЕНО ВАМИ`);
      notifyClientCancelled(updated);
      return ctx.answerCbQuery('Отменено');
    }

    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    if (action === 'blockgym') {
      const [, gym] = data.split(':');
      await sendBlockDatePicker(ctx, gym);
      return ctx.answerCbQuery();
    }
    if (action === 'blockdate') {
      const [, gym, date] = data.split(':');
      await sendBlockTimePicker(ctx, gym, date);
      return ctx.answerCbQuery();
    }
    if (action === 'blocktime') {
      const [, gym, date, time] = data.split(':');
      blockSlot(gym, date, time, 'manual');
      await ctx.editMessageText(`✅ Слот заблокирован\n${GYM_LABELS[gym] || gym}, ${date} ${time}`);
      return ctx.answerCbQuery('Заблокировано');
    }

    const [, idStr] = data.split(':');
    const id = Number(idStr);
    const booking = getBooking(id);
    if (!booking) {
      await ctx.answerCbQuery('Заявка не найдена');
      return;
    }
    if (action === 'confirm') {
      let calendarNote = '';
      let calendarEventId;
      try {
        calendarEventId = await createCalendarEvent(booking);
      } catch (err) {
        console.error('Calendar event creation failed:', err.message);
        calendarNote = '\n⚠️ Не удалось добавить в календарь';
      }
      const updated = setBookingStatus(id, 'confirmed', calendarEventId);
      await ctx.editMessageText(`${formatBooking(booking)}\n\n✅ ПОДТВЕРЖДЕНО${calendarNote}`);
      notifyClientStatus(updated);
    } else if (action === 'decline') {
      if (booking.calendar_event_id) {
        try {
          await deleteCalendarEvent(booking.calendar_event_id);
        } catch (err) {
          console.error('Calendar event deletion failed:', err.message);
        }
      }
      const updated = setBookingStatus(id, 'declined', null);
      await ctx.editMessageText(`${formatBooking(booking)}\n\n❌ ОТКЛОНЕНО`);
      notifyClientStatus(updated);
    }
    await ctx.answerCbQuery();
  });

  bot.launch();
  return bot;
}

export function notifyNewBooking(booking) {
  if (!bot) return;
  const adminChatIds = (process.env.TG_ADMIN_CHAT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  adminChatIds.forEach((chatId) => {
    bot.telegram.sendMessage(
      chatId,
      `🥋 Новая заявка!\n\n${formatBooking(booking)}`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Подтвердить', callback_data: `confirm:${booking.id}` },
            { text: '❌ Отклонить', callback_data: `decline:${booking.id}` },
          ]],
        },
      }
    ).catch((err) => console.error(`Failed to notify admin ${chatId}:`, err.message));
  });
}

// Pushed to the client's chat (if they opened the site's Telegram link) right
// after an admin confirms or declines their booking.
export function notifyClientStatus(booking) {
  if (!bot || !booking.client_chat_id) return;
  bot.telegram.sendMessage(
    booking.client_chat_id,
    `${formatBooking(booking)}\n\n${STATUS_LABELS[booking.status] || booking.status}`,
    clientCancelKeyboard(booking)
  ).catch((err) => console.error(`Failed to notify client ${booking.client_chat_id}:`, err.message));
}

// Lets admins know when a client cancels their own booking, whether via the
// site's status link (server.js) or the cancel button in this bot.
export function notifyClientCancelled(booking) {
  if (!bot) return;
  const adminChatIds = (process.env.TG_ADMIN_CHAT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  adminChatIds.forEach((chatId) => {
    bot.telegram.sendMessage(
      chatId,
      `🚫 Клиент отменил запись\n\n${formatBooking(booking)}`
    ).catch((err) => console.error(`Failed to notify admin ${chatId}:`, err.message));
  });
}

export function stopBot() {
  if (bot) bot.stop('SIGTERM');
}
