# Egern Profile

`Profile.yaml` uses Egern's native YAML fields, checked against the current
official documentation. This is split DNS, not an anonymity profile. Default
overseas DoH uses the proxy-only `海外DNS` selector; native proxy DNS remains
direct by Egern design. The public template contains no subscription credentials.

## Setup

1. Import `https://raw.githubusercontent.com/liucyin/Clash-Sub-store-Config/main/egern/Profile.yaml`
   in Egern, or import your edited local copy.
2. Edit the `全部节点` external policy group: replace its empty `urls: []` with
   your complete private Sub-Store subscription URL, or add that URL in Egern.
   There is no `<TOKEN>` placeholder in the published profile. Keep the URL and
   credentials out of commits, screenshots and public copies.
3. Keep `target=Egern` in the Sub-Store URL; a Loon subscription is not a valid
   Egern proxy source. Refresh `全部节点` and confirm it contains actual proxies.
4. Select a working subscription node in `海外DNS`. It contains subscription
   proxies and `REJECT`, not `DIRECT` or application/final groups. This selection
   is independent of `漏网之鱼`; use a stable node, normally your overseas egress.
   Egern does not provide per-application default-DNS egress selection here.
5. Activate the edited profile and check the routes and DNS behavior on the iOS
   device as described below. Importing the template alone does not supply nodes.

Remote module URLs are separate dependencies, not native Egern YAML files.
The official FAQ documents Surge modules. The developer's [2.18.0 release
notes](https://t.me/egern_news/122) add Loon plugin import; [2.21.0 release
notes](https://t.me/egern_news/125) add Loon 3.5.1 syntax and fix module DNS
upstreams. Use a current release and verify conversion/arguments in the app.

`Block_HTTPDNS` and `BlockAdvertisers` are listed first, in that order; this
does not prove how Egern merges module rules with main rules. The Loon
`Prevent_DNS_Leaks` module is disabled: its source returned HTTP 403 during
inspection, and its effective DNS changes could not be verified. Native DNS
configuration above is authoritative for this audit. Other module functions
are preserved, not certified. Confirm merged DNS and rule details on the device.

## REALITY compatibility

`Profile.yaml` has no inline proxies: `全部节点` loads an external subscription
using `target=Egern`. The v3 JavaScript generators do not run in this native
profile, so fixing a Mihomo override does not modify Egern's downloaded nodes.

For 台湾-shlii, check the private subscription's generated Egern node against
the server settings: TCP port `64325`, `user_id` matching the node UUID,
`flow: xtls-rprx-vision`, `transport.tls.sni: www.apple.com`, and
`transport.tls.reality.public_key` / `short_id` matching the node credentials.
Do not publish those credentials or hardcode the private node into this public
template. A remote provider's node conversion must be fixed at its source, not
by adding proxy fields to an `external` policy group.

Mihomo needs `reality-opts.support-x25519mlkem768: true` for this server, but that
is **not an Egern configuration field**. The current [official Egern proxy
schema](https://egernapp.com/docs/configuration/proxies#reality-configuration)
documents `public_key` and `short_id` under the native TLS `reality` block; it
does not document a corresponding MLKEM switch. Schema omission does not prove
that an Egern version supports or lacks the required handshake. Do not copy
Mihomo's `reality-opts`, `client-fingerprint`, or MLKEM switch into this profile,
and do not disable certificate verification to work around authentication.

Windows checks only confirm that this template parses as YAML and has no inline
nodes. Egern app-version compatibility, private subscription conversion and an
actual REALITY handshake remain **unverified**: update Egern, refresh its native
subscription and test 台湾-shlii on the iOS device. If it fails, inspect the
device's Egern version and handshake log before changing server versions or
protocols. The successful Mihomo checks in v3 do not establish Egern support.

## DNS and exact manifest routing

| Resolution path | Upstream | Connection policy |
| --- | --- | --- |
| Default DNS: domestic domains and exact `manifest.opensteamtool.com` | `https://223.5.5.5/dns-query`, `https://223.6.6.6/dns-query` | Explicit `DIRECT` rules for resolver IP + port 443 |
| Default DNS: other public domains | `https://1.1.1.1/dns-query`, `https://8.8.8.8/dns-query` | Proxy-only `海外DNS` group via resolver IP + port 443 |
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
The routing-side `China` rule uses the same `cn.list`. `GEOIP CN` now has
`no_resolve: true`: it only checks available IPs instead of resolving every
unmatched hostname. Domestic domains absent from `cn.list`/explicit rules may
therefore use `漏网之鱼` rather than being resolved solely to attempt `DIRECT`.

Only `manifest.opensteamtool.com` is added to `real_ip_domains`, exact domestic
DNS forwarding and exact `DIRECT` routing. Its route follows `Hijacking`, LAN
handling and the DNS port guard, and precedes application/China/final rules.
A matching deny still wins. This is not a suffix allowlist
for `opensteamtool.com` or `lua.tools`, and does not add exceptions for
`manifest.steam.run` or `gmrc.wudrm.com` or change antivirus settings.

The four resolver transport rules use Egern's documented `and` syntax with
`ip_cidr` (`no_resolve: true`) and `dest_port: "443"`. Other ports do not inherit
these DoH exceptions. After the LAN rule set, `dest_port: "53,853"` rejects
remaining routed plain DNS and standard DoT/DoQ traffic, before application and
China rules can send it directly. This guard does not intercept Egern's internal
Bootstrap or native proxy DNS, excluded routes, or arbitrary application DoH.

`close_connections_on_policy_change: true` closes connections still using an
old selection so they reconnect through the new policy. Long-lived sessions may
reconnect when auto-test changes nodes. Nineteen unreachable Cloudbet/Stake
subdomain rules were removed; their parent suffix rules retain the same policy.

Apple now uses the complete Surge RULE-SET `Apple_All_No_Resolve.list` rather
than the domain-incomplete `Apple.list`. AppStore precedes Apple; YouTube,
OneDrive and the other specific application lists precede the broad Google and
Microsoft lists. Surge rule sets are supported by Egern's official FAQ; source
entries not documented by Egern (such as `PROCESS-NAME`) and importer handling
of `no-resolve` still require checking loaded rules. Bili module `logLevel: 'off'`
is quoted to prevent YAML 1.1 parsers treating it as boolean `false`.

## Privacy and capture boundaries

- Encryption protects DNS transport, not anonymity: domestic resolvers see your
  direct source address and queried names; overseas default-DNS resolvers see
  the proxy egress selected in `海外DNS`. This does not cover native proxy DNS.
  Providers, proxies and destination services retain
  their own visibility. No `public_ip_lookup_url` is set: Egern documents that
  enabling it adds the device's public IP as EDNS Client Subnet (ECS) to upstream
  queries. Keep it unset rather than copying it from the full example.
- `proxy_nameservers` is not just a bootstrap list. Official Egern DNS behavior
  forces **every native proxy-DNS query**, including proxied destination names,
  through this list directly and skips Forward rules. Those queries are
  encrypted, but remain visible to domestic resolvers; neither `海外DNS` nor
  `漏网之鱼` can override that native path. Removing `proxy_nameservers` would
  share Forward rules but would not make native proxy DNS connections proxied.
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

Windows verification: strict YAML parsing, documented field checks, policy
references and dependency cycles, live GETs of all 35 rule URLs, real DNS wire
queries to all four DoH endpoints with certificate verification, and reference
models for DNS/routing boundaries. These are not an Egern runtime. iOS import,
native policy selection, capture behavior and packet-level verification were
**not performed** here. On the device check:

1. The profile imports without unknown-key errors and `全部节点` has real nodes.
2. Default overseas DoH uses the node selected in `海外DNS`; `REJECT` blocks this
   default-DNS path. Changing `漏网之鱼` to `DIRECT` must not make that path direct.
   Native proxy DNS is a separate direct path and is not blocked by this selector.
3. Domestic/default-manifest queries use the domestic encrypted upstreams, and
   the exact manifest route is `DIRECT` unless an earlier deny applies.
4. Router-side capture distinguishes expected local/UDP-bootstrap traffic from
   public DNS. Check UDP/TCP 53 and 853: routed public traffic is rejected after
   LAN exceptions; native Bootstrap and excluded routes are not covered.
   Confirm native proxy-DNS direct behavior, LAN access, policy switches, network
   changes and VPN reconnects.
5. Check module previews and connection details for merged DNS, effective
   `Block_HTTPDNS`/ad-block rules and `PROXY` argument bindings. HTTPS rewriting
   also requires your device's own trusted MITM CA; no private CA is supplied.

Before deployment, preserve/export your current **device** profile separately;
repository files cannot restore private device subscription settings. The audit
saved exact pre-edit local backups beside both files. After preserving any newer
edits, roll back from the repository root in PowerShell:

```powershell
Copy-Item .\egern\Profile.yaml.bak-20261107-dns-audit .\egern\Profile.yaml -Force
Copy-Item .\egern\README.md.bak-20261107-dns-audit .\egern\README.md -Force
```

Then reimport the restored local `egern/Profile.yaml` or restore the exported
device profile. Restoring repository files alone does not change the active VPN.

Schema and behavioral references: [DNS](https://egernapp.com/docs/configuration/dns),
[configuration example](https://egernapp.com/docs/configuration/example/),
[policy groups](https://egernapp.com/docs/configuration/policy_groups) and
[rule precedence](https://egernapp.com/docs/configuration/rules).
