# Uninstalling

To fully remove Automatarr from your system.

---

## Stop and Remove Containers

```bash
cd automatarr

# Stop and remove containers, networks
docker compose --profile zurg --profile plex --profile jellyfin \
  --profile arrs --profile zilean down
```

> Replace the profile flags with whichever profiles you used. Or use `--profile "*"` if supported by your Docker Compose version.

---

## Remove Docker Images

```bash
docker rmi automatarr-backend automatarr-frontend
```

To remove third-party images as well (Plex, Jellyfin, Zurg, etc.):

```bash
docker compose images -q | xargs docker rmi
```

---

## Remove Docker Volumes (Database + App Data)

> **This is irreversible.** It deletes the Automatarr database (all your movies, shows, settings) and all companion app data.

```bash
docker compose down -v
```

Or individually:

```bash
docker volume rm automatarr_zurg-data
docker volume rm automatarr_zurg-mount
docker volume rm automatarr_rclone-cache
docker volume rm automatarr_plex-config
docker volume rm automatarr_jellyfin-config
docker volume rm automatarr_jellyfin-cache
# ... etc.
```

List all Automatarr volumes:
```bash
docker volume ls | grep automatarr
```

---

## Remove the Repository

```bash
cd ..
rm -rf automatarr
```

---

## Remove Media Files / Symlinks

Automatarr does not delete media files when you remove a movie or show. After uninstalling:

```bash
# Remove symlinks (safe if using symlink mode — no actual data loss)
find /media/movies -type l -delete
find /media/shows -type l -delete

# Or remove entire library directories
rm -rf /media/movies /media/shows
```

> Only run `rm -rf` on library paths if you are sure they contain symlinks or files you no longer need.

---

## Remove rclone Mount (if applicable)

If rclone created a mount at `/mnt/zurg`:

```bash
sudo umount /mnt/zurg
# or
fusermount -u /mnt/zurg
```

Then remove the mount point:
```bash
rm -rf /mnt/zurg
```

---

## Summary Checklist

- [ ] `docker compose down` — stop containers
- [ ] `docker compose down -v` — remove volumes (optional, destructive)
- [ ] `docker rmi automatarr-backend automatarr-frontend` — remove images
- [ ] `rm -rf automatarr/` — remove code directory
- [ ] Remove media symlinks / library files if desired
- [ ] Unmount rclone FUSE mount if applicable
