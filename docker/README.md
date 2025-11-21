Quick Docker notes

Build and run locally (in the repo root):

```powershell
# build
docker compose -f docker/docker-compose.yml build

# start
docker compose -f docker/docker-compose.yml up -d

# check logs
docker compose -f docker/docker-compose.yml logs -f
```

Notes:
- The Dockerfile uses a multi-stage build and expects `npm run build` to succeed inside the builder.
- If you use volumes in development, mount source instead of copying.
- Exposes port 9002 by default.
