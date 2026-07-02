# Automatarr Wiki

**Automatarr** is a self-hosted media automation application that integrates with Real-Debrid to automatically find, download, and organize your movies and TV shows — then notify your media server (Plex, Jellyfin, or Emby) to scan.

---

## Quick Navigation

| Topic | Description |
|---|---|
| [Installation](Installation) | Docker and bare-metal setup |
| [Configuration](Configuration) | Settings reference and .env guide |
| [Real-Debrid Setup](Real-Debrid-Setup) | Connect your RD account |
| [TMDB Setup](TMDB-Setup) | Get your free metadata API key |
| [Indexers](Indexers) | Torrentio, Zilean, Jackett |
| [Movies](Movies) | Adding, searching, and managing movies |
| [TV Shows](TV-Shows) | Shows, seasons, episodes, monitoring |
| [Downloads & Queue](Downloads-and-Queue) | Monitoring active downloads |
| [Calendar](Calendar) | Upcoming episode tracking |
| [Media Servers](Media-Servers) | Plex, Jellyfin, Emby integration |
| [Notifications](Notifications) | Discord, Telegram, webhooks |
| [Apps Dashboard](Apps-Dashboard) | Companion app quick-links |
| [Updating](Updating) | How to update Automatarr |
| [Uninstalling](Uninstalling) | Full removal guide |
| [Troubleshooting](Troubleshooting) | Common issues and fixes |
| [API Reference](API-Reference) | REST API documentation |
| [Security](Security) | Hardening and network notes |
| [FAQ](FAQ) | Frequently asked questions |
| [Development](Development) | Contributing and architecture |

---

## What Automatarr Does

```
You add a movie/show
       ↓
Automatarr queries Real-Debrid via Torrentio or Zilean
       ↓
Finds a cached torrent → instantly available on RD
       ↓
Creates a symlink in your media library (or downloads the file)
       ↓
Notifies Plex / Jellyfin / Emby to refresh
       ↓
Your media server picks it up — no waiting for a download
```

## Default Ports

| Service | Default Port |
|---|---|
| Automatarr UI | **7979** |
| Automatarr API | **7980** |
| Zurg WebDAV | 9999 |
| Plex | 32400 |
| Jellyfin | 8096 |

## License

Automatarr is open-source software maintained by [Installation-04](https://github.com/installation-04).
