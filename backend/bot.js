import { Telegraf } from 'telegraf';
import {
  getBooking,
  setBookingStatus,
  listPending,
  listUpcoming,
  blockSlot,
  countActiveAtSlot,
} from './bookings.js';
import { createCalendarEvent, deleteCalendarEvent } from './calendar.js';

const GYM_LABELS = { bern: 'Bern, Автозаводская', gmgym: 'GM Gym, ул. 1905 года' };
const FORMAT_LABELS = { personal: 'Персональная', group: 'Мини-группа' };

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

export function initBot({ token, adminChatIds }) {
  bot = new Telegraf(token);

  function isAdmin(ctx) {
    return adminChatIds.map(String).includes(String(ctx.chat.id));
  }

  bot.command('start', (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply(`Доступ только для администратора. Твой chat_id: ${ctx.chat.id}`);
    ctx.reply(`Привет! Твой chat_id: ${ctx.chat.id}\n\nКоманды:\n/pending — заявки на подтверждение\n/week — подтверждённые тренировки на неделю\n/block ДЕНЬ ВРЕМЯ ЗАЛ — заблокировать слот вручную`);
  });

  bot.command('pending', (ctx) => {
    if (!isAdmin(ctx)) return;
    const pending = listPending();
    if (!pending.length) return ctx.reply('Нет заявок на подтверждение.');
    pending.forEach((b) => {
      ctx.reply(formatBooking(b), {
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Подтвердить', callback_data: `confirm:${b.id}` },
            { text: '❌ Отклонить', callback_data: `decline:${b.id}` },
          ]],
        },
      });
    });
  });

  bot.command('week', (ctx) => {
    if (!isAdmin(ctx)) return;
    const upcoming = listUpcoming();
    if (!upcoming.length) return ctx.reply('Подтверждённых тренировок нет.');
    ctx.reply(upcoming.map(formatBooking).join('\n\n'));
  });

  bot.command('block', (ctx) => {
    if (!isAdmin(ctx)) return;
    const parts = ctx.message.text.split(' ').slice(1);
    const [date, time, gym] = parts;
    if (!date || !time || !gym || !GYM_LABELS[gym]) {
      return ctx.reply('Формат: /block ГГГГ-ММ-ДД ЧЧ:ММ зал\nЗалы: bern, gmgym');
    }
    blockSlot(gym, date, time, 'manual');
    ctx.reply(`Слот ${date} ${time} (${GYM_LABELS[gym]}) заблокирован.`);
  });

  bot.on('callback_query', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    const data = ctx.callbackQuery.data || '';
    const [action, idStr] = data.split(':');
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
      setBookingStatus(id, 'confirmed', calendarEventId);
      await ctx.editMessageText(`${formatBooking(booking)}\n\n✅ ПОДТВЕРЖДЕНО${calendarNote}`);
    } else if (action === 'decline') {
      if (booking.calendar_event_id) {
        try {
          await deleteCalendarEvent(booking.calendar_event_id);
        } catch (err) {
          console.error('Calendar event deletion failed:', err.message);
        }
      }
      setBookingStatus(id, 'declined', null);
      await ctx.editMessageText(`${formatBooking(booking)}\n\n❌ ОТКЛОНЕНО`);
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

export function stopBot() {
  if (bot) bot.stop('SIGTERM');
}
