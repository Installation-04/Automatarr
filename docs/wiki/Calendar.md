# Calendar

The Calendar view shows upcoming TV episodes across all your monitored shows, so you can see what's airing soon.

---

## What the Calendar Shows

The calendar displays episodes that:
- Belong to a monitored show
- Have an air date set in TMDB
- Are in `missing`, `wanted`, `downloading`, or `downloaded` status

Each entry shows:
- Show poster thumbnail
- Show title
- Season and episode number (e.g. S02E05)
- Episode title
- Air date
- Status badge

---

## Status Colors

| Status | Color | Meaning |
|---|---|---|
| `downloaded` | Green | Already in your library |
| `downloading` | Blue | Being downloaded right now |
| `wanted` | Yellow | Scheduled for download |
| `missing` | Grey | Not yet aired or not monitored |

---

## How Air Dates Trigger Downloads

Automatarr's **Refresh Job** runs on the configured interval (default: every 6 hours). It:
1. Finds all `missing` episodes with an air date on or before today
2. Marks them as `wanted`
3. They are picked up on the next **Search Job** (default: every 30 minutes)

This means an episode that airs at midnight will typically be picked up and searched within 30 minutes of the refresh job running (so within 6.5 hours worst case, or within 30 minutes if the refresh job just ran).

To pick up a just-aired episode immediately:
1. Click **Refresh** on the show page to update episode data from TMDB
2. Click **Search All** to immediately queue all wanted episodes

---

## Upcoming Episodes (Dashboard Widget)

The Dashboard includes an **Upcoming** widget that shows the next 7 days of episodes from your monitored shows. It mirrors the Calendar data but is limited to near-term airings.

---

## Troubleshooting

### An episode I expected to see isn't showing

1. Check that the show's **Monitor** flag is on
2. Check that the season's **Monitor** flag is on
3. Click **Refresh** on the show to pull the latest episode data from TMDB — air dates sometimes change

### Episode shows as `missing` after it aired

The refresh job hasn't run yet since the air date. Either wait for the next cycle, or click **Refresh** on the show and then **Search All** to trigger immediately.
