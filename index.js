const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

const API_TOKEN = '7371925431:AAHY5qzwuN9qQ58pVBfgb00GN5TvhZsveSQ';
const CHANNEL_USERNAMES = ['@QUICK_TIPS_AND_TRICKS', '@THE_ANON_69'];
const LOG_CHANNEL_ID = '@logsspl';

const bot = new TelegramBot(API_TOKEN, { polling: true });

let user_data = {};
let referral_data = {};
let referred_users = new Set();
let bot_active = true;

const DATA_FILE = 'bot_data.json';

function saveData() {
  const data = {
    user_data,
    referral_data,
    referred_users: Array.from(referred_users)
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    user_data = data.user_data || {};
    referral_data = data.referral_data || {};
    referred_users = new Set(data.referred_users || []);
  }
}

bot.onText(/\/start(?: (.+))?/, (msg, match) => {
  const userId = msg.from.id;
  const referrerId = match[1] ? parseInt(match[1], 10) : null;

  if (referrerId && referrerId !== userId && !referred_users.has(userId)) {
    if (!referral_data[referrerId]) {
      referral_data[referrerId] = { count: 0, referrals: [] };
    }
    referral_data[referrerId].referrals.push(userId);
    referred_users.add(userId);
    user_data[referrerId] = (user_data[referrerId] || 0) + 4;
    referral_data[referrerId].count += 1;
    bot.sendMessage(referrerId, `Your referral ${msg.from.username} has started the bot. You earned 4 coins!`);
    saveData();
  }

  const joinChannelButtons = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Join QUICK_TIPS_AND_TRICKS', url: 'https://t.me/QUICK_TIPS_AND_TRICKS' }],
        [{ text: 'Join THE_ANON_69', url: 'https://t.me/THE_ANON_69' }],
        [{ text: 'Check Joined', callback_data: 'check_joined' }]
      ]
    }
  };
  bot.sendMessage(msg.chat.id, "Please join both of our channels first:", joinChannelButtons);
});

async function checkChannelMembership(userId) {
  try {
    for (const channel of CHANNEL_USERNAMES) {
      const member = await bot.getChatMember(channel, userId);
      if (!['member', 'administrator', 'creator'].includes(member.status)) {
        return false;
        }
      
