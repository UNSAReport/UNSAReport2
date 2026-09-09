# UNSAReport monorepo

Moon 2.5.4 + bun + go monorepo: `auth/` (IdP), `registry/` (package registry),
`web/` (unified TanStack Start frontend + packages), `tui/` (Go CLI).
Gateway: single Traefik entrypoint `http://localhost:9876`.

Run `just decrypt dev`, then `just infra-up dev`, then `just dev dev`.
`ENV` proxies the environment name (`dev` default); future environments add
`compose.<env>.yml`, `.env.<env>.example`, and `secrets/*.<env>.enc.env`
following the `dev` pattern. Per-command override: `ENV=staging just <recipe>`.

## Environment setup & local overrides

Running `just decrypt <env>` materializes `.env.<ENV>` at the root and in all sub-services (`auth/`, `registry/`, `slides/`, `web/`, `tui/`):

1. **Base Defaults**: Copied from `.env.example` and `<service>/.env.example`.
2. **SOPS Vaults (Automatic)**: If SOPS age keys are configured, encrypted secrets (`secrets/global.<ENV>.enc.env` and `secrets/<app>.<ENV>.enc.env`) are decrypted and appended. If keys are not present (e.g. external open-source contributors), vault decryption is cleanly skipped with an informational notice.
3. **Global Contributor Overrides**: If `.env.<ENV>.override` (e.g. `.env.dev.override`) exists in the repository root, its variables are appended to root and all services.
4. **Service-Specific Overrides**: If `<service>/.env.<ENV>.override` (e.g. `auth/.env.dev.override`) exists, its variables are appended to that service's env file, taking highest precedence.

All `.env.*.override` files are gitignored so personal credentials or custom ports are never committed.

## Ports & host firewall (dev)

Traefik runs in bridge mode and reaches natively-run dev servers through
`host.docker.internal`. Container-to-host traffic crosses the host firewall,
so allow the backend ports before starting the gateway:

| Host port | Process            | Rule                              |
| --------- | ------------------ | --------------------------------- |
| 3000      | auth (bun, native) | ALLOW TCP from bridge subnet only |
| 3001      | registry (bun, native) | ALLOW TCP from bridge subnet only |
| 3100      | website (vite, native) | ALLOW TCP from bridge subnet only |
| 9876      | traefik (published gateway) | normal inbound as needed   |

`5432`/`5433` (postgres) and `9000`/`9001` (minio) are already-published
container ports and need no new rule.

Find the bridge subnet (after `just infra-up dev`):

```bash
docker network inspect unsareport-dev --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'
```

`ufw` example (run per port or combined):

```bash
SUBNET=$(docker network inspect unsareport-dev --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
sudo ufw allow from "$SUBNET" to any port 3000,3001,3100 proto tcp
```

`firewalld` equivalent:

```bash
SUBNET=$(docker network inspect unsareport-dev --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3000 protocol=tcp accept"
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3001 protocol=tcp accept"
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3100 protocol=tcp accept"
sudo firewall-cmd --reload
```

If the firewall cannot scope to a subnet, allowlisting `172.16.0.0/12` for
those three ports is the fallback.
