# Egern Profile

`Profile.yaml` uses Egern's native YAML syntax and keeps the v3 routing rules at
higher priority than the additional Loon rules.

## Setup

1. Import `https://raw.githubusercontent.com/liucyin/Clash-Sub-store-Config/main/egern/Profile.yaml` in Egern.
2. Replace `<TOKEN>` in the `全部节点` URL with the private Sub-Store token, or
   import the profile first and edit the `全部节点` policy group in Egern.
3. Keep `target=Egern`; a Loon subscription is not a valid Egern proxy source.

The live subscription URL is intentionally excluded because this repository is
public. The supplied Loon `.lpx` and `.plugin` resources are referenced through
Egern's compatible module importer.

## DNS

Domestic domains use domestic encrypted DNS. Other domains use overseas DoH,
and the DoH server IPs are routed through `漏网之鱼`. Proxy server hostnames use
direct domestic DNS to avoid a DNS-to-proxy dependency loop.

Egern does not bind a DNS upstream to each application policy group like Mihomo
does. Therefore application DNS cannot dynamically follow every selected group;
the profile instead uses one selectable overseas DNS egress via `漏网之鱼`.
