# v3：链式代理、清单路由与 DNS 加固

## 生效前先读

这些文件是配置源码；推送仓库不会自动修改正在运行的 Sparkle、FlClash、Sub-Store 或系统网络，也不会修改杀软白名单、系统 hosts、网卡 DNS 或防火墙。

**这是分流 DNS，不是“所有 DNS 都隐藏本机 IP”的匿名方案。** 默认国外解析恢复跟随 `漏网之鱼`，OpenAI、Claude、Gemini 等原有指定业务域名恢复跟随对应业务组；不再创建独立、隐藏的 `DNS` 组。国内域名和直连目标仍使用直连的加密 DNS。

DNS 出口随相关策略组切换：选 `DIRECT` 就直连，选 `REJECT` 就拒绝，选节点就经过该节点。恢复旧版分流不等于恢复明文 fallback、过宽的系统 DNS 例外或移除清单例外；不再承诺空订阅或所有业务组都保持纯代理、失败关闭。

## 使用哪个脚本

| 文件 | 用途 |
| --- | --- |
| `chain-proxy-config.js` | 通用 Mihomo/Sub-Store 配置生成器 |
| `chain-proxy-config.local.js` | 本机版本，保留 `127.0.0.1:7911–7913` 的 Turb 中转入口 |
| `flclash-chain-proxy-override.js` | FlClash 独立覆写；补全缺失组、规则集和路由 |
| `config.test.cjs` | 使用 Node 内置测试运行器检查规则顺序、DNS 策略引用、清单例外、provider-only 和重复生成 |

三个脚本保持独立使用，不新增运行时模块依赖。`.bak-20260806-project-listeners` 是历史备份，不作为当前入口，也未随本次改动更新。

### 部署到客户端

1. 导出当前客户端配置并保留私有订阅信息。
2. Sparkle 如果加载远程 GitHub 覆写，在客户端刷新覆写脚本并重新生成配置；若使用本地覆写，重新加载修改后的文件。不要只改生成的 `data/work/config.yaml`，该文件可能被重载覆盖。
3. FlClash 使用修改后的独立覆写脚本；Sub-Store 更新实际引用的脚本后重新生成配置。
4. 检查实际生成配置：默认 DoH 带 `#漏网之鱼`、业务 DoH 带对应业务组名，不再有本脚本生成的独立 `DNS` 组；清单域名仍保留 Real-IP、国内 DoH 和精确 `DIRECT` 规则。TUN 开启且捕获 UDP/TCP 53。客户端若覆盖 TUN/DNS 设置，最终配置和实际状态优先于脚本。
5. 本机验证内核是 Mihomo Meta v1.19.31。使用支持 `dns-mode: hijack` 和 `empty-fallback` 的 Mihomo 内核，不要假定旧版 Clash 内核支持这些字段。

## DNS 的具体出口

| 查询类别 | 上游 | 传输与出口 |
| --- | --- | --- |
| 默认国外公网名称 | `1.1.1.1`、`8.8.8.8` | HTTPS DoH，跟随 `漏网之鱼` 当前选择 |
| 原有指定业务域名 | 同上 | HTTPS DoH，跟随对应业务组当前选择 |
| `geosite:cn` 和精确清单主站 | `223.5.5.5`、`223.6.6.6` | HTTPS DoH，显式 `DIRECT` |
| 其他直连目标、代理节点自身的域名 | 同上 | HTTPS DoH，显式 `DIRECT`，避免代理启动依赖环 |
| `.lan`、`.local`、`.home.arpa` | 系统 DNS | 有意保留的局域网命名例外，可能明文 |
| 加密解析器的启动解析 | IP 字面量 HTTPS DoH | 不需要先用明文 DNS 解析 DoH 服务器域名 |

- 公网上游均使用 IP 字面量 HTTPS，不跳过证书校验，不注入公网 IP/ECS，不继承订阅中的明文 `fallback` 或可覆盖节点解析的 `proxy-server-nameserver-policy`。
- 恢复的 v3 业务 DNS 策略包括 OpenAI、Claude、Facebook、Gemini、Speedtest、Bybit、bybit.eu、Plasma One、UK-Wifi-Calling、Kraken、Wise、OKX、PayPal、Binance、Monzo、Revolut 和 Grok；两个主生成器另恢复其原有 `ether-fi` 策略。FlClash 按其原有映射恢复，不新增业务范围。
- 删除了原先过宽的 `geosite:private → system://`，只留下明确的 LAN 后缀例外。
- `tun.enable`、`auto-route`、`auto-detect-interface`、`strict-route` 与 `dns-mode: hijack` 开启，同时捕获 `any:53` 和 `tcp://any:53`。FlClash 不再保留继承的公网路由/接口/应用绕过例外；依赖分应用或分网段绕过 VPN 的配置需要重新评估。
- 顶层 `ipv6: false` 和 DNS `ipv6: false` 保留；内核 DNS 对 AAAA 返回空答案。这不等于关闭 Windows 网卡 IPv6，也不能保证任意应用的字面量 IPv6 或外部 VPN 不绕行。

### 不能承诺的部分

加密 DNS 仍向解析器披露查询名称。选择 `DIRECT` 时，DoH 解析器知道本机公网 IP；选择代理时，解析器通常看到相关策略组的节点出口。业务组内如果最终选到直连，相关国外 DNS 也会直连。代理运营方、目标网站和客户端本身仍有各自可见性。

脚本无法完全约束任意应用自带 DoH/DoT、系统服务、其他 VPN、网卡局域网 DNS、进程/设备级旁路、TUN 未运行或客户端覆盖配置。Windows 的 `strict-route` 能缓解多宿主 DNS，但不等于已对整台电脑完成抓包验证。浏览器安全 DNS、Android 私人 DNS、Apple 私密中继等应在实际设备上单独检查；不通过关闭杀软来排错。

## 清单主站与安全软件

仅添加精确域名 `manifest.opensteamtool.com`：Real-IP 例外、国内 DoH 策略与 `DOMAIN,...,DIRECT` 路由。它排在显式拒绝/Hijacking 规则之后、泛用规则之前。没有把整个 `opensteamtool.com`、`lua.tools` 或杀软报警的 `manifest.steam.run`、HTTP `gmrc.wudrm.com` 加入直连白名单，也没有固定 Cloudflare CDN IP。

Fake-IP 返回 `198.18.x.x` 是正常的内部映射，本身不是 DNS 泄露或连接失败的证据。`ping` 是否成功也不能代替 HTTPS/API 测试。单个 HTTP 403/502 不能单独证明是代理出口、杀软还是服务器的问题；安全软件检测详情仍需独立核对。

本机隔离实例已确认精确域名规则命中 `DIRECT`，且 DNS 能得到真实 A 记录。但该次 HTTPS 请求仍返回 Cloudflare 403，因此本次改动**不代表清单下载故障已经解决**。测试运行在现有主机网络下，未关闭正在运行的 Sparkle TUN，更不能把它当作已验证的无代理物理出口。

## 修复的问题与证据

| 观察到的问题 | 修复 |
| --- | --- |
| FlClash 继承 `dns-hijack: []` 后不捕获 DNS、顶层 IPv6 缺省时未赋值、缺少 `auto-route` | 强制安全值并合并 UDP/TCP 捕获项 |
| FlClash 继承明文 fallback、任意 system 解析和 `prefer-h3` | 清除不安全继承；DNS 分流按用户选择恢复跟随漏网之鱼和原有业务组 |
| 已有 `MATCH` 后继续追加默认规则，新增规则不可达 | 删除中间终结规则，保留首个终结策略并放在末尾，按顺序保留普通自定义规则 |
| 主生成器丢失只有 `proxy-providers` 的订阅 | 保留 provider，合并所需组和规则集 |
| 重复执行主生成器会复制链式节点/组，默认数组/对象可能跨次共享 | 过滤本脚本旧克隆，替换自有链式组，深拷贝默认与订阅对象 |
| 本地版本无节点/只有 provider 时 Turb 中转组无法通过内核解析 | 引入 provider，空节点时显式 `REJECT`，保留 7911–7913 端口 |

## 验证结果与复现

在仓库根目录运行：

```console
node --test v3/config.test.cjs
```

本次执行 13 项回归，覆盖规则顺序、精确清单边界、provider-only、重新生成后的解析策略引用、危险继承覆盖、原有业务 DNS 映射、重复调用和本地监听入口，全部通过。

另执行了 Mihomo v1.19.31 原生 `-t`：3 个脚本各生成空订阅、内联节点、provider-only 和危险继承配置，共 12 个场景。测试使用隔离目录和无凭据节点，不会装载到现有 Sparkle。

对生成后的实际配置启动隔离核心，关闭该实例 TUN 并使用独立端口 `17893/19096/11053`，避免修改主机路由：

- UDP/TCP 53 服务均返回 Fake-IP；AAAA 返回空答案。
- 清单主站通过国内 TLS 校验 DoH 得到真实 A 记录，路由实际命中 `DIRECT`。
- 三个脚本均验证了 `漏网之鱼` 与 OpenAI/Grok 的互相独立选择：一方选 `REJECT` 时只拒绝该方查询，另一方经节点解析成功；清单解析始终成功。另验证 `漏网之鱼[DIRECT]` 的实际 DoH 日志。不再存在独立 `DNS` 组。
- 选择 `REJECT` 的组拒绝对应查询，其他业务组及清单例外不随之改动；选择 `DIRECT` 则允许直连 DoH，不承诺旧版分流的空订阅行为为失败关闭。

隔离实例和生成的临时文件已关闭/清理。**未执行**：替换线上 Sparkle 配置、启用第二个系统 TUN、整机出站抓包、iOS Egern 运行验证。因此不能写“本机永不泄露”。

上线后应在设备/router 抓包复核公网 UDP/TCP 53、853 和 IPv6，区分允许的 LAN 例外与异常公网解析；公网 DNS 泄露测试出现国内解析器也可能来自本方案有意设置的国内直连路径。

### 回滚
修改前的五个既有文件另有逐文件备份：`D:/Projects/.clash-dns-backup-20261029-1793251468200/`，其中 `egern/` 和 `v3/` 保留原目录结构；验证临时目录不属于回滚备份。


本次恢复 DNS 策略前的配置在提交 `62af4a9`；更早的 `150f3ad` 不包含本次保留的清单例外。保存后续编辑后，可恢复三份脚本与 Egern 文件：

```console
git restore --source=62af4a9 -- v3/chain-proxy-config.js v3/chain-proxy-config.local.js v3/flclash-chain-proxy-override.js egern/Profile.yaml egern/README.md v3/README.md v3/config.test.cjs
```

恢复源码后仍需让客户端重新加载；Git 回滚不会自动更换正在运行的配置。私有订阅、客户端实际配置和网卡状态必须用部署前单独保存的副本还原。

## 官方参考

- [Mihomo DNS](https://wiki.metacubex.one/config/dns/)
- [Mihomo TUN](https://wiki.metacubex.one/config/inbound/tun/)
- [Mihomo proxy groups](https://wiki.metacubex.one/config/proxy-groups/)
- [Egern DNS 及其不同的原生解析边界](https://egernapp.com/docs/configuration/dns/)
- [本仓库 Egern 使用说明](../egern/README.md)
