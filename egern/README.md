# Egern Profile

`Profile.yaml` uses Egern's native YAML syntax and keeps the v3 routing rules at
higher priority than the additional Loon rules. This is split DNS, not an
anonymity profile. Overseas default DNS follows the selected `漏网之鱼` policy;
the public template deliberately contains no subscription credentials.

## Setup

1. Import `https://raw.githubusercontent.com/liucyin/Clash-Sub-store-Config/main/egern/Profile.yaml`
   in Egern, or import your edited local copy.
2. Edit the `全部节点` external policy group: replace its empty `urls: []` with
   your complete private Sub-Store subscription URL, or add that URL in Egern.
   There is no `<TOKEN>` placeholder in the published profile. Keep the URL and
   credentials out of commits, screenshots and public copies.
3. Keep `target=Egern` in the Sub-Store URL; a Loon subscription is not a valid
   Egern proxy source. Refresh `全部节点` and confirm it contains actual proxies.
4. Choose the desired egress in `漏网之鱼`: a node proxies default overseas DNS,
   `DIRECT` sends it directly, and `REJECT` rejects it. There is no separate
   hidden `DNS` group. Unlike v3, this native Egern profile does not provide
   per-application DNS egress selection.
5. Activate the edited profile and check the routes and DNS behavior on the iOS
   device as described below. Importing the template alone does not supply nodes.

The supplied Loon `.lpx` and `.plugin` resources remain referenced through
Egern's compatible module importer; unrelated groups and modules are unchanged.

## DNS and exact manifest routing

| Resolution path | Upstream | Connection policy |
| --- | --- | --- |
| Default DNS: domestic domains and exact `manifest.opensteamtool.com` | `https://223.5.5.5/dns-query`, `https://223.6.6.6/dns-query` | Explicit `DIRECT` rules for these resolver IPs |
| Default DNS: other public domains | `https://1.1.1.1/dns-query`, `https://8.8.8.8/dns-query` | Current selection in `漏网之鱼` |
| Native proxy DNS: proxy destination names and proxy server hostnames | Domestic IP-literal DoH above | Always direct, enforced by Egern itself |
| Local names and private IPv4 reverse lookups | System DNS | Explicit local-only forwarding exceptions |

All configured encrypted DNS servers use IP-literal HTTPS endpoints with
`skip_tls_verify: false`; no DNS-server hostname lookup is needed and certificate
verification is not bypassed. Obsolete hostname-to-IP resolver hosts entries
were removed. No website or Cloudflare CDN address is pinned in `hosts`.

DNS Forward rules use first-match ordering: `local`, `lan`, `home.arpa` and
private/loopback/link-local IPv4 reverse names are local system-DNS exceptions;
the exact manifest domain precedes the domestic `cn.list`/`.cn` rules; a final
`domain_wildcard: "*"` sends all other names to `Overseas`. The former blanket
`arpa` system-DNS exception was narrowed so public reverse queries no longer
use system DNS. There is no public `system`/`bootstrap` forwarding fallback.
The routing-side `China` rule uses the same `cn.list`; `GEOIP CN` remains a
resolving fallback for domestic domains not covered by that domain set.

Only `manifest.opensteamtool.com` is added to `real_ip_domains`, exact domestic
DNS forwarding and exact `DIRECT` routing. Its route follows the explicit
reject safeguards, including `Hijacking`, and precedes generic LAN/application/
China/final rules. A matching deny still wins. This is not a suffix allowlist
for `opensteamtool.com` or `lua.tools`, and does not add exceptions for
`manifest.steam.run` or `gmrc.wudrm.com` or change antivirus settings.

Overseas resolver IP routes again select `漏网之鱼`, restoring the original
Egern egress choice without removing the exact manifest exceptions. Selecting
`DIRECT` in `漏网之鱼` now also makes default overseas DNS direct. Only the two
configured overseas resolver addresses are routed specially. Egern DNS does not
dynamically follow each application policy group.

## Privacy and capture boundaries

- Encryption protects DNS transport, not anonymity: domestic resolvers see your
  direct source address and queried names; overseas default-DNS resolvers see
  either the proxy egress or the direct address selected by `漏网之鱼`.
  Providers, proxies and destination services retain
  their own visibility. No `public_ip_lookup_url` is set: Egern documents that
  enabling it adds the device's public IP as EDNS Client Subnet (ECS) to upstream
  queries. Keep it unset rather than copying it from the full example.
- `proxy_nameservers` is not just a bootstrap list. Official Egern DNS behavior
  forces **every native proxy-DNS query**, including proxied destination names,
  through this list directly and skips Forward rules. Those queries are now
  encrypted, but remain visible to domestic resolvers; the default-DNS split
  policy and `漏网之鱼` selection cannot override that native path.
- Egern bootstrap supports **plaintext direct UDP only**. Explicit bootstrap
  IPs remain because an absent or invalid list falls back to system DNS.
  IP-literal DoH and the final public Forward catchall avoid routine upstream-
  hostname bootstrap and unmatched public-query fallback; they do not remove
  Egern's native UDP bootstrap capability or guarantee it can never be used.
- `include_all_networks: true` strengthens supported VPN capture and
  `hijack_dns: ["*"]` uses the documented all-address DNS capture form.
  `compat_route: true` remains unchanged. Local networks, APNs and cellular
  services remain excluded, and existing `bypass_tunnel_proxy` and
  `vif_excluded_routes` exceptions are retained to avoid disrupting LAN access.
  Traffic using those exclusions is outside the capture guarantee.
- This does not control arbitrary application DoH, other VPNs, compromised
  clients, or traffic outside the active Egern VPN. It cannot promise zero DNS
  leakage; a DNS test showing a domestic resolver may be expected on direct or
  native proxy-DNS paths, not proof that encryption failed.

## Device verification and rollback

Configuration changes were prepared on Windows. iOS Egern import, native policy
selection, capture behavior, TLS handshakes and packet-level runtime verification
were **not performed** here. Before relying on the profile, on the device check:

1. The profile imports without unknown-key errors and `全部节点` has real nodes.
2. Default overseas DNS follows `漏网之鱼`: node selection proxies it, `DIRECT`
   sends it directly, and `REJECT` rejects it without changing manifest DNS.
3. Domestic/default-manifest queries use the domestic encrypted upstreams, and
   the exact manifest route is `DIRECT` unless an earlier deny applies.
4. Router-side capture distinguishes expected local/UDP-bootstrap traffic from
   public DNS, checks UDP and TCP port 53, and confirms the native proxy-DNS
   direct boundary. Also test LAN access, network changes and VPN reconnects.

Before deployment, preserve/export your current **device** profile separately;
git cannot restore private device subscription settings. The tracked pre-change
configuration before this DNS-policy restoration is available at commit `62af4a9`. From the repository root, review
only these files with `git diff -- egern/Profile.yaml egern/README.md`.
To roll back the repository changes, after saving any newer local edits, run:

```console
git restore --source=62af4a9 -- egern/Profile.yaml egern/README.md
```

Then reimport the restored local `egern/Profile.yaml` or restore the exported
device profile. Restoring repository files alone does not change the active VPN.

Schema and behavioral references: [DNS](https://egernapp.com/docs/configuration/dns),
[configuration example](https://egernapp.com/docs/configuration/example/),
[policy groups](https://egernapp.com/docs/configuration/policy_groups) and
[rule precedence](https://egernapp.com/docs/configuration/rules).
