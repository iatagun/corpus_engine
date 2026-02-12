# Troubleshooting Guide

## 1. Docker Connection Error
**Error**: `open //./pipe/docker_engine: The system cannot find the file specified.`
**Cause**: The Docker CLI cannot connect to the Docker Desktop daemon. This is common on Windows if Docker Desktop is not running or doesn't have administrative privileges.

**Solutions**:
1.  **Start Docker Desktop**: Search for "Docker Desktop" in your Start Menu and launch it. Wait for the whale icon to stop animating.
2.  **Enable Expose Daemon**: In Docker Desktop Settings > General, ensure "Expose daemon on tcp://localhost:2375 without TLS" is checked (if using WSL 2, this might not be needed, but good to check).
3.  **Run as Administrator**: Try opening your terminal (PowerShell/CMD) as Administrator.
4.  **WSL 2 Integration**: In Docker Settings > Resources > WSL Integration, ensure your distro (e.g., Ubuntu) is toggled ON.

## 2. OpenSearch Connection Error
**Error**: `ConnectionError: Connection Error` (from `npm run init-index`)
**Cause**: The Node.js script cannot reach OpenSearch at `https://localhost:9200`.

**Solutions**:
1.  **Check Containers**: Run `docker ps`. You should see `opensearch-node` and `corpus-postgres`.
    *   *If empty*: Run `docker compose up -d`.
2.  **Wait for Startup**: OpenSearch takes 30-60 seconds to start. Run `docker logs opensearch-node` and look for "Node 'opensearch-node' initialized".
3.  **Certificate Issues**: We set `ssl: { rejectUnauthorized: false }` in the code, but ensure `http://` vs `https://` matches your `docker-compose.yml` (our config uses HTTP for internal, but OpenSearch defaults to HTTPS. The current setup expects `http` for local dev or simplified https).

## 3. Build Errors
**Error**: `Cannot find module...`
**Cause**: Monorepo symlinks not created.

**Solutions**:
1.  Run `npm install` in the root directory.
2.  Run `npm run build` to compile all workspaces.

## 4. Resetting Data
If you want to start fresh:
1.  `docker compose down -v` (Deletes all data volumes)
2.  `docker compose up -d`
3.  `npm run init-index --workspace=apps/indexer`
