# Notifications

Automatarr can send notifications when media is grabbed, downloaded, or encounters an error.

---

## Supported Channels

| Channel | Type |
|---|---|
| **Discord** | Webhook |
| **Telegram** | Bot API |
| **Custom Webhook** | Generic HTTP POST |

---

## Notification Events

| Event | Setting | Triggered when |
|---|---|---|
| **Grab** | `notify_on_grab` | A torrent is submitted to Real-Debrid |
| **Download** | `notify_on_download` | A file is saved/symlinked to your library |
| **Error** | `notify_on_error` | A grab or download attempt fails |

All three are enabled by default. Toggle them individually in **Settings → Notifications**.

---

## Discord

### Setup

1. Open your Discord server settings
2. Go to **Integrations → Webhooks → New Webhook**
3. Choose the channel, give it a name (e.g. `Automatarr`), copy the webhook URL
4. Paste it into **Settings → Notifications → Discord Webhook**

### Message Format

Discord notifications are sent as plain text messages:
```
[Automatarr] 🎬 Grabbed: Inception (2010) — 1080p
[Automatarr] ✅ Downloaded: Inception (2010)
[Automatarr] ❌ Error: The Dark Knight (2008) — No cached results found
```

---

## Telegram

### Setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts — you'll get a **bot token** like `123456789:ABCdef...`
3. Start a conversation with your bot, or add it to a channel/group
4. Get your chat ID:
   - For personal chat: message `@userinfobot` to get your ID
   - For a group: add your bot, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates` to find the `chat.id`
5. In Automatarr **Settings → Notifications**:
   - **Telegram Bot Token**: your bot token
   - **Telegram Chat ID**: your chat/group ID (negative for groups, e.g. `-1001234567890`)

---

## Custom Webhook

### Setup

In **Settings → Notifications → Webhook URL**, enter any HTTP/HTTPS URL.

### Payload

Automatarr sends a POST request with a JSON body:

```json
{
  "event": "download",
  "media_type": "movie",
  "media_title": "Inception (2010)",
  "message": "Downloaded: Inception (2010)"
}
```

**Fields:**
- `event`: `grab`, `download`, or `error`
- `media_type`: `movie` or `episode`
- `media_title`: human-readable title
- `message`: the full notification text

### Example: ntfy.sh

```
https://ntfy.sh/my-automatarr-topic
```

Automatarr will POST to that URL, and ntfy.sh will deliver it to your phone.

### Example: Gotify

```
https://gotify.example.com/message?token=YOUR_APP_TOKEN
```

Note: If your webhook provider expects a different JSON schema, you may need a small middleware to adapt the payload.

---

## Troubleshooting

### Notifications not arriving

1. Verify the webhook URL/bot token is saved correctly
2. Check that the relevant `notify_on_*` toggle is enabled
3. Check backend logs for errors: `docker compose logs backend --tail 50`
4. For Telegram, ensure the bot has been started (send `/start` to the bot) and the chat ID is correct
5. For Discord, test the webhook URL manually:
   ```bash
   curl -H "Content-Type: application/json" \
     -d '{"content":"Test from Automatarr"}' \
     YOUR_DISCORD_WEBHOOK_URL
   ```
