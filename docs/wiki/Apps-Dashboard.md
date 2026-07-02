# Apps Dashboard

The Apps Dashboard is a quick-launch panel showing all companion apps in your media stack. Each app appears as a clickable card that opens its URL in a new tab.

---

## How It Works

Apps are shown/hidden based on the `enabled` flag for each service. If an app is enabled, its card appears on the dashboard.

Configure apps in **Settings → Apps**:
- Toggle the `enabled` switch to show/hide the app
- Set the URL to point to the correct host/port

---

## Included Apps

### Debrid Stack

| App | Default URL | Description |
|---|---|---|
| **Zurg** | `http://zurg:9999` | Real-Debrid WebDAV server |
| **rclone** | `http://rclone:5572` | rclone remote control interface |
| **Decypharr** | `http://decypharr:8282` | Alternative RD download manager |
| **NZBdav** | `http://nzbdav:8080` | NZB via WebDAV |
| **AltMount** | `http://altmount:8088` | Alternative mount solution |
| **CLI Debrid** | `http://cli-debrid:3000` | CLI-based debrid tool |

### Content Orchestrators

| App | Default URL | Description |
|---|---|---|
| **Riven** | `http://riven:8080` | Media automation platform |
| **Pulsarr** | `http://pulsarr:3003` | Plex/Sonarr/Radarr sync |
| **Neutarr** | `http://neutarr:8191` | FlareSolverr-based arr companion |

### Arr Suite

| App | Default URL | Description |
|---|---|---|
| **Radarr** | `http://radarr:7878` | Movie management |
| **Sonarr** | `http://sonarr:8989` | TV show management |
| **Prowlarr** | `http://prowlarr:9696` | Indexer manager |
| **Lidarr** | `http://lidarr:8686` | Music management |
| **Readarr** | `http://readarr:8787` | Books management |
| **Bazarr** | `http://bazarr:6767` | Subtitle management |
| **Whisparr** | `http://whisparr:6969` | Adult content management |
| **Profilarr** | `http://profilarr:6868` | Quality profile sync |

### Request & Discovery

| App | Default URL | Description |
|---|---|---|
| **Overseerr** | `http://overseerr:5055` | Media request management |
| **Jellyseerr** | `http://jellyseerr:5055` | Jellyfin-based request manager |

### Analytics & Monitoring

| App | Default URL | Description |
|---|---|---|
| **Tautulli** | `http://tautulli:8181` | Plex statistics and monitoring |

### Infrastructure

| App | Default URL | Description |
|---|---|---|
| **Traefik** | `http://traefik:8080` | Reverse proxy dashboard |
| **pgAdmin** | `http://pgadmin:5050` | PostgreSQL administration |
| **Cloudflared** | `http://localhost:14333` | Cloudflare tunnel |

---

## Adding a Custom App

Custom apps are not currently supported via the UI. However, any of the above apps can be pointed to any URL — for example, if you run Radarr on a different host, set the Radarr URL to `http://192.168.1.50:7878`.

---

## URL Notes

- **Inside Docker**: Use Docker service names as hostnames (e.g. `http://radarr:7878`). These resolve within the `automatarr` Docker network.
- **Outside Docker / external server**: Use the host IP or hostname and the mapped port (e.g. `http://192.168.1.100:7878`).
- **Behind reverse proxy**: Use the proxy URL (e.g. `https://radarr.yourdomain.com`).

The URL you configure is the one that will be opened in your browser when you click the app card — make sure it's accessible from the browser, not just from the Docker network.
