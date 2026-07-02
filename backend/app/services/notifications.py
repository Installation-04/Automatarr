import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def send_discord(webhook_url: str, title: str, message: str, color: int = 0x6c63ff):
    if not webhook_url:
        return
    payload = {
        "embeds": [{
            "title": title,
            "description": message,
            "color": color,
        }]
    }
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.post(webhook_url, json=payload)
        except Exception as e:
            logger.warning("Discord notification failed: %s", e)


async def send_telegram(bot_token: str, chat_id: str, message: str):
    if not bot_token or not chat_id:
        return
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.post(url, json={"chat_id": chat_id, "text": message, "parse_mode": "HTML"})
        except Exception as e:
            logger.warning("Telegram notification failed: %s", e)


async def send_webhook(webhook_url: str, payload: dict):
    if not webhook_url:
        return
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.post(webhook_url, json=payload)
        except Exception as e:
            logger.warning("Webhook notification failed: %s", e)


async def notify(
    settings: dict,
    event: str,
    title: str,
    message: str,
):
    """Send notifications for an event if enabled."""
    notify_map = {
        "grab": "notify_on_grab",
        "download": "notify_on_download",
        "error": "notify_on_error",
    }
    setting_key = notify_map.get(event, "notify_on_download")
    if settings.get(setting_key) != "true":
        return

    colors = {"grab": 0xf59e0b, "download": 0x10b981, "error": 0xef4444}
    color = colors.get(event, 0x6c63ff)
    full_message = f"**{title}**\n{message}"

    discord = settings.get("discord_webhook", "")
    if discord:
        await send_discord(discord, f"Automatarr — {event.capitalize()}", full_message, color)

    tg_token = settings.get("telegram_bot_token", "")
    tg_chat = settings.get("telegram_chat_id", "")
    if tg_token and tg_chat:
        await send_telegram(tg_token, tg_chat, f"<b>{title}</b>\n{message}")

    webhook = settings.get("webhook_url", "")
    if webhook:
        await send_webhook(webhook, {"event": event, "title": title, "message": message})
