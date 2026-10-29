// Mihomo 链式代理完整配置脚本
// 功能：合并了基础配置和链式代理扩展功能
// 使用：订阅中已包含家宽节点，AI 服务走【机场中转 → 家宽落地】

// ========================================
// 配置区域（需要根据实际情况修改）
// ========================================

// 家宽节点识别关键词（用于从订阅中筛选家宽节点）
// 支持正则表达式，多个关键词用 | 分隔
const homeProxyFilter = "家宽|Home|住宅|Residential|IPLC|Hd|SC|DMIT|CORONA";

// 链式代理组名称
const chainProxyGroupName = "🏠 链式代理";

// 链式代理中转节点选择组名称  
const dialerProxyGroupName = "🔗 链式中转";

// 是否添加链式代理到手动选择组（true=可以手动切换，false=仅自动分流）
const addToManualSelect = false;

// AI 服务走链式代理的规则（优先级最高）
const chainProxyRules = [
  // AI 服务域名
  "DOMAIN-SUFFIX,oaistatic.com," + chainProxyGroupName,
  "DOMAIN-SUFFIX,cdn.oaistatic.com," + chainProxyGroupName,
  "DOMAIN-SUFFIX,gstatic.com," + chainProxyGroupName,

  // 通过规则集匹配
  "RULE-SET,ai," + chainProxyGroupName,
  "RULE-SET,AI," + chainProxyGroupName,
];

// AI 规则集配置（会自动添加到配置中）
const aiRuleProviders = {
  "ai": {
    "type": "http",
    "behavior": "classical",
    "format": "yaml",
    "interval": 3600,
    "url": "https://fastly.jsdelivr.net/gh/MadisonWirtanen/WARP-Clash-with-ZJU-Rules@main/ai.yaml"
  },
  "AI": {
    "type": "http",
    "behavior": "classical",
    "format": "text",
    "interval": 3600,
    "url": "https://github.com/Repcz/Tool/raw/X/Clash/Rules/AI.list"
  }
};

// ========================================
// 基础配置模板
// ========================================

const baseConfig = {
  // 通用配置
  mode: "rule",
  ipv6: false,
  "mixed-port": 7890,
  "allow-lan": false,
  "bind-address": "127.0.0.1",
  "log-level": "error",
  "unified-delay": true,
  // 规则里已无有效的 PROCESS-NAME 规则，strict 会让每条新连接都查进程表（Windows 上开销明显）
  "find-process-mode": "off",

  // 规则选择缓存
  profile: {
    "store-selected": true,
    "store-fake-ip": true
  },

  "tcp-concurrent": true,
  "keep-alive-interval": 15,
  "keep-alive-idle": 15,
  // 保持 false，否则上面两行失效，空闲连接会被 NAT 静默回收，再次使用时需等重传超时
  "disable-keep-alive": false,

  // 公网 DNS 仅用校验证书的 DoH；国外查询走独立 DNS 组，失败不回退直连。
  dns: {
    enable: true,
    listen: "127.0.0.1:1053",
    ipv6: false,
    "prefer-h3": false,
    "respect-rules": true,
    "use-hosts": true,
    "use-system-hosts": false,
    "cache-algorithm": "arc",
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-filter-mode": "blacklist",
    "fake-ip-filter": [
      "+.lan",
      "+.local",
      "+.home.arpa",
      "+.msftconnecttest.com",
      "+.msftncsi.com",
      "localhost.ptlogin2.qq.com",
      "localhost.sec.qq.com",
      "localhost.work.weixin.qq.com",
      "manifest.opensteamtool.com"
    ],
    "default-nameserver": [
      "https://223.5.5.5/dns-query",
      "https://223.6.6.6/dns-query"
    ],
    nameserver: [
      "https://1.1.1.1/dns-query#DNS",
      "https://8.8.8.8/dns-query#DNS"
    ],
    // 节点自身域名必须直连解析，避免建立代理前先依赖代理的循环。
    "proxy-server-nameserver": [
      "https://223.5.5.5/dns-query#DIRECT",
      "https://223.6.6.6/dns-query#DIRECT"
    ],
    "direct-nameserver": [
      "https://223.5.5.5/dns-query#DIRECT",
      "https://223.6.6.6/dns-query#DIRECT"
    ],
    "direct-nameserver-follow-policy": true,
    "nameserver-policy": {
      "manifest.opensteamtool.com": [
        "https://223.5.5.5/dns-query#DIRECT",
        "https://223.6.6.6/dns-query#DIRECT"
      ],
      "geosite:cn": [
        "https://223.5.5.5/dns-query#DIRECT",
        "https://223.6.6.6/dns-query#DIRECT"
      ],
      // 仅局域网命名允许系统解析；不把整个 private 集合交给 system。
      "+.lan,+.local,+.home.arpa": ["system://"]
    }
  },

  // GEO 配置
  "geodata-mode": true,
  "geo-auto-update": true,
  "geo-update-interval": 24,
  "geodata-loader": "standard",
  "geox-url": {
    geoip: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat",
    geosite: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
    mmdb: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb",
    asn: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb"
  },

  // 时间同步
  ntp: {
    enable: true,
    "write-to-system": false,
    server: "ntp1.aliyun.com",
    port: 123,
    interval: 30
  },

  // 入站配置
  tun: {
    enable: true,
    stack: "mixed",
    "strict-route": true,
    "auto-route": true,
    "dns-mode": "hijack",
    "auto-redirect": false,
    "auto-detect-interface": true,
    "dns-hijack": [
      "any:53",
      "tcp://any:53"
    ],
    "route-exclude-address": [],
    // 1500 在 PPPoE(1492) 或 UDP 承载的节点上会造成分片/PMTU 黑洞：
    // 小包(ping)正常 0 丢包，大包(网页/下载)被丢 —— 表现为「0 丢包但很卡」
    mtu: 1400
  },

  // 嗅探配置
  sniffer: {
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "override-destination": false,
    sniff: {
      TLS: {
        ports: [443, 8443]
      },
      HTTP: {
        ports: [80, "8080-8880"],
        "override-destination": true
      },
      QUIC: {
        ports: [443, 8443]
      }
    },
    "force-domain": [],
    "skip-domain": [
      "+.oray.com",
      "Mijia Cloud",
      "+.push.apple.com"
    ]
  },

  // 面板设置
  "external-controller": "127.0.0.1:9090",
  secret: "",
  "external-ui": "./ui",
  "external-ui-name": "zashboard",
  "external-ui-url": "https://github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip",

  // 代理组配置
  "proxy-groups": [
    // 只含节点，不引用可切到 DIRECT 的业务组；空订阅拒绝而非隐式直连。
    {
      name: "DNS",
      type: "select",
      hidden: true,
      "include-all": true,
      "exclude-type": "Direct|Reject|RejectDrop|Compatible|Pass",
      "exclude-filter": "🔗",
      "empty-fallback": "REJECT"
    },
    // 手动选择 - 引用所有订阅节点
    {
      name: "手动选择",
      type: "select",
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png",
      "include-all": true,
      proxies: [
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    // 自动选择 - 自动测速选择最快节点
    {
      name: "自动选择",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png"
    },

    // 应用分组
    {
      name: "GLOBAL",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Apple",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "AppStore",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/App_Store.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "BiliBili",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/bilibili_4.png",
      "include-all": true,
      proxies: [
        "DIRECT",
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "REJECT"
      ]
    },

    {
      name: "Speedtest",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Speedtest.png",
      "include-all": true,
      proxies: [
        "DIRECT",
        "手动选择",
        "自动选择",
        "香港手动选择",
        "台湾手动选择",
        "日本手动选择",
        "新加坡手动选择",
        "美国手动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "REJECT"
      ]
    },

    {
      name: "Bybit",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/bybit.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "bybit.eu",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/bybit.eu.png",
      "include-all": true,
      proxies: [
        "英国手动选择",
        "英国",
        "德国",
        "法国",
        "手动选择",
        "自动选择",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "ether-fi",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/ether-fi.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Plasma One",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/plasma.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "UK-Wifi-Calling",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/Uk-wifi-calling.png",
      "include-all": true,
      proxies: [
        "英国手动选择",
        "英国",
        "手动选择",
        "自动选择",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Wise",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/wise.png",
      "include-all": true,
      proxies: [
        "DIRECT",
        "美国手动选择",
        "美国",
        "英国",
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "REJECT"
      ]
    },

    {
      name: "OKX",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/okx.png",
      "include-all": true,
      proxies: [
        "美国手动选择",
        "美国",
        "日本手动选择",
        "日本",
        "新加坡手动选择",
        "新加坡",
        "香港手动选择",
        "香港",
        "台湾手动选择",
        "台湾",
        "手动选择",
        "自动选择",
        "澳门",
        "韩国",
        "英国",
        "德国",
        "法国",
        "印度",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "PayPal",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/PayPal.png",
      "include-all": true,
      proxies: [
        "美国手动选择",
        "美国",
        "英国手动选择",
        "英国",
        "手动选择",
        "自动选择",
        "日本",
        "新加坡",
        "香港",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Binance",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/binance.png",
      "include-all": true,
      proxies: [
        "日本手动选择",
        "日本",
        "新加坡手动选择",
        "新加坡",
        "香港手动选择",
        "香港",
        "台湾手动选择",
        "台湾",
        "手动选择",
        "自动选择",
        "美国",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Monzo",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/monzo.png",
      "include-all": true,
      proxies: [
        "英国手动选择",
        "英国",
        "手动选择",
        "美国手动选择",
        "美国",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Revolut",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/revolut.png",
      "include-all": true,
      proxies: [
        "英国手动选择",
        "英国",
        "美国手动选择",
        "美国",
        "新加坡手动选择",
        "新加坡",
        "手动选择",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Claude",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/claude.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Cursor",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/cursor.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Disney",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Disney.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Duolingo",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/duolingo.png",
      "include-all": true,
      proxies: [
        "美国手动选择",
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Emby",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Emby.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Facebook",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Facebook.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Gemini",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/guaishouxiaoqi/icons@master/Color/Gemini.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Grok",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/grok.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Kraken",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/kraken.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Perplexity",
      type: "select",
      "disable-udp": false,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/perplexity.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Github",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/GitHub.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Google",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Microsoft",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Netflix",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "OpenAI",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "OneDrive",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/OneDrive.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Steam",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Steam.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Spotify",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "TikTok",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png",
      "include-all": true,
      proxies: [
        "台湾",
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Telegram",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "Twitter",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Twitter.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "YouTube",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/YouTube.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "漏网之鱼",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Final.png",
      "include-all": true,
      proxies: [
        "手动选择",
        "自动选择",
        "香港",
        "澳门",
        "台湾",
        "日本",
        "韩国",
        "美国",
        "英国",
        "德国",
        "法国",
        "印度",
        "新加坡",
        "印尼",
        "越南",
        "泰国",
        "澳洲",
        "巴西",
        "其他",
        "DIRECT",
        "REJECT"
      ]
    },

    {
      name: "直连",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png",
      proxies: [
        "DIRECT",
        "REJECT"
      ]
    },

    // 地区分组 - 自动从订阅中筛选对应地区节点
    {
      name: "香港",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png",
      filter: "🇭🇰|香港|港|HK|hongkong|hong kong"
    },

    {
      name: "澳门",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Macao.png",
      filter: "🇲🇴|澳门|门|MO|macao"
    },

    {
      name: "台湾",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png",
      filter: "🇹🇼|台湾|台|TW|taiwan|taipei"
    },

    {
      name: "日本",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png",
      filter: "🇯🇵|日本|JP|japan|tokyo|osaka"
    },

    {
      name: "韩国",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Korea.png",
      filter: "🇰🇷|韩国|韩|KR|korea|seoul"
    },

    {
      name: "美国",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png",
      filter: "🇺🇸|美国|美|US|united states|america|los angeles|san jose|silicon valley"
    },

    {
      name: "英国",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Kingdom.png",
      filter: "🇬🇧|英国|英|UK|united kingdom|london"
    },

    {
      name: "德国",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Germany.png",
      filter: "🇩🇪|德国|德|DE|germany|frankfurt"
    },

    {
      name: "法国",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/France.png",
      filter: "🇫🇷|法国|法|FR|france|paris"
    },

    {
      name: "印度",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/India.png",
      filter: "🇮🇳|印度|IN|india|mumbai"
    },

    {
      name: "新加坡",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png",
      filter: "🇸🇬|新加坡|新|SG|singapore"
    },

    {
      name: "印尼",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/indonesia.png",
      filter: "🇮🇩|印尼|印度尼西亚|ID|indonesia|jakarta"
    },

    {
      name: "越南",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/vietnam.png",
      filter: "🇻🇳|越南|VN|vietnam"
    },

    {
      name: "泰国",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Thailand.png",
      filter: "🇹🇭|泰国|TH|thailand|bangkok"
    },

    {
      name: "澳洲",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Australia.png",
      filter: "🇦🇺|澳大利亚|AU|australia|sydney"
    },

    {
      name: "巴西",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Brazil.png",
      filter: "🇧🇷|巴西|brazil"
    },

    {
      name: "其他",
      type: "url-test",
      interval: 300,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 5000,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
      // 原先用 (?!...) 负向先行断言，Go 的 RE2 不支持该语法；改用 exclude-filter 表达同样的意图
      "exclude-filter": "(?i)(香港|台湾|日本|韩国|新加坡|美国|英国|德国|法国|印度|泰国|越南|印尼|澳大利亚|巴西|港|台|日|韩|新|美|英|德|法|印|泰|越|尼|澳|巴|hk|tw|jp|kr|sg|us|uk|de|fr|in|th|vn|id|au|br)"
    },

    // 地区手动选择分组 - 手动选择对应地区节点
    {
      name: "香港手动选择",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png",
      "include-all": true,
      "exclude-filter": "🔗",
      filter: "🇭🇰|香港|港|HK|hongkong|hong kong"
    },
    {
      name: "台湾手动选择",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png",
      "include-all": true,
      "exclude-filter": "🔗",
      filter: "🇹🇼|台湾|台|TW|taiwan|taipei"
    },
    {
      name: "日本手动选择",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png",
      "include-all": true,
      "exclude-filter": "🔗",
      filter: "🇯🇵|日本|日|JP|japan|tokyo"
    },
    {
      name: "新加坡手动选择",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png",
      "include-all": true,
      "exclude-filter": "🔗",
      filter: "🇸🇬|新加坡|新|SG|singapore"
    },
    {
      name: "美国手动选择",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png",
      "include-all": true,
      "exclude-filter": "🔗",
      filter: "🇺🇸|美国|美|US|united states|america"
    },
    {
      name: "英国手动选择",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Kingdom.png",
      "include-all": true,
      "exclude-filter": "🔗",
      filter: "🇬🇧|英国|英|UK|united kingdom|london"
    },
  ],

  // 规则提供者
  "rule-providers": {
    Apple: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Apple/Apple_Classical.yaml"
    },
    AppStore: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppStore/AppStore.yaml"
    },
    BiliBili: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BiliBili/BiliBili.yaml"
    },
    Bybit: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/classical/bybit.yaml"
    },
    China: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/China/China_Classical_No_Resolve.yaml"
    },
    Claude: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Claude/Claude.yaml"
    },
    Disney: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Disney/Disney.yaml"
    },
    Emby: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Emby/Emby.yaml"
    },
    Facebook: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Facebook/Facebook.yaml"
    },
    Gemini: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Gemini/Gemini.yaml"
    },
    Github: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GitHub/GitHub.yaml"
    },
    Google: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Google/Google.yaml"
    },
    Hijacking: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Hijacking/Hijacking.yaml"
    },
    Lan: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Lan/Lan_No_Resolve.yaml"
    },
    Microsoft: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Microsoft/Microsoft.yaml"
    },
    Netflix: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix.yaml"
    },
    OpenAI: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OpenAI/OpenAI.yaml"
    },
    OneDrive: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OneDrive/OneDrive.yaml"
    },
    Steam: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Steam/Steam.yaml"
    },
    Spotify: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Spotify/Spotify.yaml"
    },
    TikTok: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TikTok/TikTok.yaml"
    },
    Twitter: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Twitter/Twitter.yaml"
    },
    Telegram: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Telegram/Telegram.yaml"
    },
    YouTube: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouTube/YouTube.yaml"
    },
    Speedtest: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Speedtest/Speedtest.yaml"
    },
    duolingo: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "漏网之鱼",
      url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/duolingo.yaml"
    },
    kraken: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "漏网之鱼",
      url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/kraken.yaml"
    },
    cursor: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "漏网之鱼",
      url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/cursor.yaml"
    },
    wise: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "漏网之鱼",
      url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/wise.yaml"
    },
    okx: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "漏网之鱼",
      url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/okx.yaml"
    },
    paypal: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://cdn.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@latest/VirtualFinance/Paypal.yaml"
    },
    binance: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "漏网之鱼",
      url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/binance.yaml"
    },
    monzo: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://cdn.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@latest/VirtualFinance/Monzo.yaml"
    },
    revolut: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://cdn.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@latest/VirtualFinance/Revolut.yaml"
    },
    perplexity: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "漏网之鱼",
      url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/perplexity.yaml"
    },
    "UK-Wifi-Calling": {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "text",
      proxy: "漏网之鱼",
      url: "https://raw.githubusercontent.com/iniwex5/tools/refs/heads/main/rules/UK-wifi-call.list"
    },
    ifast: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "漏网之鱼",
      url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/ifast.yaml"
    }
  },

  // 路由规则
  rules: [
    // 拒绝规则 - 最高优先级
    "AND,((NETWORK,UDP),(DST-PORT,443)),REJECT",
    "DOMAIN-SUFFIX,account.listary.com,REJECT",
    "DOMAIN-SUFFIX,auth.listary.com,REJECT",
    "DOMAIN-SUFFIX,api.getfiddler.com,REJECT",

    // 仅清单主站直连；不为安全软件报警的备用站点做放行。
    "DOMAIN,manifest.opensteamtool.com,DIRECT",

    // 自定义规则 - 优先级最高
    "DOMAIN-SUFFIX,portal101.cn,直连",
    "DOMAIN-SUFFIX,javasec.org,直连",
    "DOMAIN-SUFFIX,deepseek.com,直连",
    // Grok 域名规则
    "DOMAIN-SUFFIX,grok.com,Grok",
    "DOMAIN-SUFFIX,x.ai,Grok",

    // 测速服务规则
    "GEOSITE,ookla-speedtest,Speedtest",
    "RULE-SET,Speedtest,Speedtest",
    "DOMAIN-SUFFIX,oca.nflxvideo.net,Speedtest",

    // Perplexity 域名规则
    "RULE-SET,perplexity,Perplexity",

    // Cursor 域名规则
    "RULE-SET,cursor,Cursor",

    // Duolingo 域名规则
    "RULE-SET,duolingo,Duolingo",

    // Kraken 域名规则
    "RULE-SET,kraken,Kraken",

    // Wise 域名规则
    "RULE-SET,wise,Wise",

    // OKX 域名规则
    "RULE-SET,okx,OKX",

    // 金融服务域名规则
    "RULE-SET,paypal,PayPal",
    "RULE-SET,binance,Binance",
    "RULE-SET,monzo,Monzo",
    "RULE-SET,revolut,Revolut",
    "DOMAIN-SUFFIX,ether.fi,ether-fi",
    "DOMAIN-SUFFIX,plasma-one.tech,Plasma One",
    "DOMAIN-SUFFIX,plasma.org,Plasma One",
    "DOMAIN-SUFFIX,plasma.to,Plasma One",
    "DOMAIN-SUFFIX,plasmascan.to,Plasma One",
    "DOMAIN-KEYWORD,plasma-one,Plasma One",
    "DOMAIN-SUFFIX,bybit.eu,bybit.eu",
    "DOMAIN-SUFFIX,krak.app,英国手动选择",
    "RULE-SET,UK-Wifi-Calling,UK-Wifi-Calling",

    // iFast 域名规则
    "RULE-SET,ifast,直连",

    // Cloudbet 域名规则 - 默认走台湾
    "DOMAIN-SUFFIX,cloudbet.com,台湾",
    "DOMAIN-SUFFIX,cldbt.cloud,台湾",
    "DOMAIN-SUFFIX,sports-api.cloudbet.com,台湾",
    "DOMAIN-SUFFIX,api.cloudbet.com,台湾",
    "DOMAIN-SUFFIX,cdn.cloudbet.com,台湾",
    "DOMAIN-SUFFIX,media.cloudbet.com,台湾",
    "DOMAIN-SUFFIX,affiliates.cloudbet.com,台湾",
    "DOMAIN-SUFFIX,play-cloudbet.com,台湾",
    "DOMAIN-SUFFIX,share.cloudbet.com,台湾",
    "DOMAIN-SUFFIX,a.cloudbet.com,台湾",
    "DOMAIN-SUFFIX,int.cloudbet.com,台湾",
    "DOMAIN-SUFFIX,ws.cloudbet.com,台湾",
    "DOMAIN-SUFFIX,wss.cloudbet.com,台湾",

    // Stake.com 域名规则 - 默认走日本
    "DOMAIN-SUFFIX,stake.com,日本",
    "DOMAIN-SUFFIX,stake.bet,日本",
    "DOMAIN-SUFFIX,stake.games,日本",
    "DOMAIN-SUFFIX,stake.ac,日本",
    "DOMAIN-SUFFIX,stake.pet,日本",
    "DOMAIN-SUFFIX,api.stake.com,日本",
    "DOMAIN-SUFFIX,sports.stake.com,日本",
    "DOMAIN-SUFFIX,cdn.stake.com,日本",
    "DOMAIN-SUFFIX,assets.stake.com,日本",
    "DOMAIN-SUFFIX,img.stake.com,日本",
    "DOMAIN-SUFFIX,ws.stake.com,日本",
    "DOMAIN-SUFFIX,wss.stake.com,日本",
    "DOMAIN-SUFFIX,payment.stake.com,日本",
    "DOMAIN-KEYWORD,deposit.stake,日本",
    "DOMAIN-KEYWORD,withdraw.stake,日本",
    "DOMAIN-SUFFIX,stake.bet.br,日本",
    "DOMAIN-SUFFIX,stake.com.co,日本",
    "DOMAIN-SUFFIX,stake.mx,日本",

    // 规则集匹配
    "RULE-SET,Lan,直连,no-resolve",
    "RULE-SET,Microsoft,Microsoft",
    "RULE-SET,Bybit,Bybit",
    "RULE-SET,China,直连,no-resolve",

    // 宽泛的关键词兜底 - 必须排在 China 之后，否则会误伤含 stake/cloudbet 的国内域名
    "DOMAIN-KEYWORD,cloudbet,台湾",
    "DOMAIN-KEYWORD,stake,日本",

    "RULE-SET,Telegram,Telegram",
    "RULE-SET,Facebook,Facebook",
    "RULE-SET,Gemini,Gemini",
    "RULE-SET,YouTube,YouTube",
    "RULE-SET,Google,Google",
    "RULE-SET,Github,Github",
    "RULE-SET,BiliBili,BiliBili",
    "RULE-SET,OneDrive,OneDrive",
    "RULE-SET,TikTok,TikTok",
    "RULE-SET,Spotify,Spotify",
    "RULE-SET,Netflix,Netflix",
    "RULE-SET,Disney,Disney",
    "RULE-SET,OpenAI,OpenAI",
    "RULE-SET,Twitter,Twitter",
    "RULE-SET,AppStore,AppStore",
    "RULE-SET,Claude,Claude",
    "RULE-SET,Steam,Steam",
    "RULE-SET,Emby,Emby",
    "RULE-SET,Hijacking,REJECT",
    "GEOIP,CN,直连,no-resolve",

    // 兜底规则
    "MATCH,漏网之鱼"
  ]
};

// ========================================
// 脚本主函数
// ========================================

const orderedApplicationGroups = [
  "Apple", "AppStore", "BiliBili", "Binance", "Bybit", "bybit.eu", "ether-fi", "Claude", "Cursor",
  "Disney", "Duolingo", "Emby", "Facebook", "Gemini", "Github", "Google", "Grok",
  "Kraken", "Microsoft", "Monzo", "Netflix", "OKX", "OneDrive", "OpenAI",
  "PayPal", "Perplexity", "Plasma One", "Revolut", "Speedtest", "Spotify", "Steam",
  "Telegram", "TikTok", "Twitter", "UK-Wifi-Calling", "Wise", "YouTube"
];

function orderApplicationProxyGroups(proxyGroups) {
  const orderedNames = new Set(orderedApplicationGroups);
  const firstIndex = proxyGroups.findIndex(group => orderedNames.has(group.name));
  if (firstIndex === -1) return proxyGroups;

  const groupsByName = new Map(proxyGroups.map(group => [group.name, group]));
  const orderedGroups = orderedApplicationGroups
    .map(name => groupsByName.get(name))
    .filter(Boolean);
  const remainingGroups = proxyGroups.filter(group => !orderedNames.has(group.name));
  remainingGroups.splice(firstIndex, 0, ...orderedGroups);
  return remainingGroups;
}

function main(config, profileName) {
  console.log("🚀 开始处理链式代理配置...");

  // 订阅可只提供 proxy-providers；深拷贝避免覆写原订阅或污染下一次调用。
  const subscription = JSON.parse(JSON.stringify(config || {}));
  config = JSON.parse(JSON.stringify(baseConfig));
  config.proxies = (subscription.proxies || []).filter(proxy =>
    !(proxy.name?.startsWith('🔗 ') && proxy['dialer-proxy'] === dialerProxyGroupName)
  );
  config['proxy-providers'] = subscription['proxy-providers'] || {};
  const groupsByName = new Map(config['proxy-groups'].map(group => [group.name, group]));
  (subscription['proxy-groups'] || []).forEach(group => groupsByName.set(group.name, group));
  // DNS 不引用业务组，也不继承订阅中可能含 DIRECT 的同名组。
  groupsByName.set('DNS', JSON.parse(JSON.stringify(baseConfig['proxy-groups'][0])));
  config['proxy-groups'] = [...groupsByName.values()];
  config['rule-providers'] = {
    ...config['rule-providers'],
    ...subscription['rule-providers']
  };
  const incomingRules = subscription.rules?.length ? subscription.rules : config.rules;
  const isTerminal = rule => /^(MATCH|FINAL),/i.test(rule);
  const finalRule = incomingRules.find(isTerminal) || 'MATCH,漏网之鱼';
  const manifestRule = 'DOMAIN,manifest.opensteamtool.com,DIRECT';
  const denyRules = [...baseConfig.rules.slice(0, 4), 'RULE-SET,Hijacking,REJECT'];
  for (const rule of incomingRules) {
    if (isTerminal(rule) || !/,REJECT(?:-DROP|Drop)?(?:,no-resolve)?$/i.test(rule)) break;
    if (!denyRules.includes(rule)) denyRules.push(rule);
  }
  const prefix = [...denyRules, manifestRule];
  config.rules = [...prefix, ...incomingRules.filter(rule =>
    !isTerminal(rule) && !prefix.includes(rule)
  ), finalRule.replace(/^FINAL,/i, 'MATCH,')];

  Object.values(config['rule-providers'] || {}).forEach(provider => {
    if (provider?.url?.includes('raw.githubusercontent.com')) {
      provider.proxy = '漏网之鱼';
    }
  });

  // 1. 获取所有节点
  const proxies = config.proxies || [];
  console.log(`📡 总节点数: ${proxies.length}`);

  // 2. 识别家宽节点
  const homeProxyFilterValue = typeof homeProxyFilter !== 'undefined' ? homeProxyFilter : '';
  const homeProxies = proxies.filter(proxy => {
    // 如果没有定义 filter，则不匹配任何节点
    if (!homeProxyFilterValue) return false;
    const regex = new RegExp(homeProxyFilterValue, 'i');
    try {
      const decodedName = decodeURIComponent(proxy.name);
      return regex.test(proxy.name) || regex.test(decodedName);
    } catch (e) {
      return regex.test(proxy.name);
    }
  });

  const hasHomeProxies = homeProxies.length > 0;
  let chainHomeProxies = [];

  if (hasHomeProxies) {
    console.log(`🏠 识别到 ${homeProxies.length} 个家宽节点:`);
    homeProxies.forEach(p => console.log(`   - ${p.name}`));

    // 3. 为链式代理创建家宽节点的克隆（带 dialer-proxy）
    chainHomeProxies = homeProxies.map(proxy => {
      const clonedProxy = JSON.parse(JSON.stringify(proxy));
      clonedProxy.name = '🔗 ' + proxy.name;
      clonedProxy['dialer-proxy'] = dialerProxyGroupName;
      return clonedProxy;
    });

    // 将克隆的链式家宽节点添加到 proxies 列表
    proxies.push(...chainHomeProxies);
    console.log(`✅ 已创建 ${chainHomeProxies.length} 个链式落地节点`);
  } else {
    console.warn("⚠️ 未找到家宽节点，将不创建链式落地节点。");
  }

  config.proxies = proxies;

  // 4. 创建代理组
  const proxyGroups = config['proxy-groups'] || [];

  // 只有检测到家宽节点时才创建链式代理组
  if (hasHomeProxies) {
    // 创建链式中转节点选择组（包含所有节点，包括家宽节点）
    const dialerGroup = {
      name: dialerProxyGroupName,
      type: 'select',
      icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png',
      'include-all': true,
      'exclude-filter': '🔗|DIRECT|REJECT'
    };

    // 创建链式代理组（只包含克隆的链式家宽节点）
    const chainGroup = {
      name: chainProxyGroupName,
      type: 'select',
      icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png',
      proxies: chainHomeProxies.map(p => p.name)
    };

    // 替换本脚本的已有分组，重复覆写不生成重名组。
    const retainedGroups = proxyGroups.filter(group =>
      group.name !== chainProxyGroupName && group.name !== dialerProxyGroupName
    );
    proxyGroups.splice(0, proxyGroups.length, dialerGroup, chainGroup, ...retainedGroups);

    console.log("✅ 已创建链式代理组（已移至最前）:");
    console.log(`   - ${dialerProxyGroupName} (中转节点选择，包含所有节点)`);
    console.log(`   - ${chainProxyGroupName} (链式家宽落地选择)`);
  } else {
    console.log("ℹ️ 未检测到家宽节点，跳过链式代理组创建");
  }

  // 5. 将链式代理添加到手动选择组（可选）
  if (addToManualSelect && hasHomeProxies) {
    const manualGroup = proxyGroups.find(g =>
      g.name === '手动选择' ||
      g.name === '🚀 节点选择' ||
      g.name === 'PROXY' ||
      g.type === 'select'
    );

    if (manualGroup && manualGroup.proxies) {
      manualGroup.proxies.unshift(chainProxyGroupName);
      console.log(`✅ 已将链式代理添加到 ${manualGroup.name}`);
    }
  }

  // 6. 修改应用分组，加入链式代理选项
  if (hasHomeProxies) {
    // 链式代理排在首位 = 该组默认选中链式代理
    const chainDefaultGroups = ["Apple", "AppStore", "BiliBili", "Claude", "Cursor", "Disney", "Emby", "Facebook", "Gemini", "Grok", "Perplexity", "Github", "Google", "Microsoft", "Netflix", "OpenAI", "OneDrive", "Steam", "Spotify", "TikTok", "Telegram", "Twitter", "YouTube"]
    // 兜底/全局组只把链式代理作为可选项（插到第二位），默认仍走单跳。
    // DNS 已独立使用纯代理组，业务兜底流量不必默认增加一跳。
    const chainOptionalGroups = ["手动选择", "GLOBAL", "漏网之鱼"]

    chainDefaultGroups.forEach(groupName => {
      const group = proxyGroups.find(g => g.name === groupName);
      if (group && group.proxies) {
        group.proxies = [chainProxyGroupName, ...group.proxies.filter(p => p !== chainProxyGroupName)];
        console.log(`✅ ${groupName} 默认使用链式代理`);
      }
    });

    chainOptionalGroups.forEach(groupName => {
      const group = proxyGroups.find(g => g.name === groupName);
      if (group && group.proxies) {
        const rest = group.proxies.filter(p => p !== chainProxyGroupName);
        group.proxies = rest.length ? [rest[0], chainProxyGroupName, ...rest.slice(1)] : [chainProxyGroupName];
        console.log(`✅ ${groupName} 提供链式代理选项（非默认）`);
      }
    });
  }

  // 7. 只有创建了链式代理时，才处理排除规则
  if (hasHomeProxies) {
    proxyGroups.forEach(group => {
      // 跳过链式代理相关的组
      if (group.name === chainProxyGroupName || group.name === dialerProxyGroupName) {
        return;
      }

      // 为其他组添加排除规则，只排除克隆的链式节点
      if (group.filter || group['include-all']) {
        if (group['exclude-filter']) {
          if (!group['exclude-filter'].split('|').includes('🔗')) group['exclude-filter'] += '|🔗';
        } else {
          group['exclude-filter'] = '🔗';
        }
      }
    });

    console.log("✅ 所有代理组现在都包含原始家宽节点（可直连）");
    console.log("✅ 只有 🏠 链式代理 组中的节点走链式代理");
  }

  config['proxy-groups'] = orderApplicationProxyGroups(proxyGroups);

  // 8. 添加 AI 规则集（可选，如果需要更全面的 AI 规则）
  // 注释掉以避免与策略组规则冲突，让用户可以在策略组中灵活切换
  // const ruleProviders = config['rule-providers'] || {};
  // Object.assign(ruleProviders, aiRuleProviders);
  // config['rule-providers'] = ruleProviders;
  // console.log("✅ 已添加 AI 规则集");

  // 9. 不添加强制链式代理规则，让策略组规则生效
  // 用户可以在 OpenAI/Gemini/Claude 等策略组中选择是否使用链式代理
  // const rules = config.rules || [];
  // config.rules = [...chainProxyRules, ...rules];
  // console.log(`✅ 已添加 ${chainProxyRules.length} 条链式代理规则`);
  console.log("✅ 保留原有规则，AI 服务将走各自的策略组");

  if (hasHomeProxies) {
    console.log("🎉 链式代理配置完成！");
    console.log("\n使用说明：");
    console.log(`1. 在 ${dialerProxyGroupName} 中选择机场中转节点`);
    console.log(`2. 在 ${chainProxyGroupName} 中选择家宽落地节点（链式代理组）`);
    console.log("3. AI 服务走各自的策略组（OpenAI/Gemini/Claude等）");
    console.log(`4. 这些策略组默认选项是 ${chainProxyGroupName}，可手动切换`);
    console.log("5. 如需使用链式代理，在对应策略组中选择 🏠 链式代理\n");
  } else {
    console.log("🎉 配置完成！未检测到家宽节点，使用标准代理模式。\n");
  }

  return config;
}

// ========================================
// 辅助函数
// ========================================

// 如果需要调试，可以打印配置信息
function debugConfig(config) {
  console.log("=== 配置调试信息 ===");
  console.log("节点总数:", config.proxies?.length || 0);
  console.log("代理组数:", config['proxy-groups']?.length || 0);
  console.log("规则数:", config.rules?.length || 0);
  console.log("规则集数:", Object.keys(config['rule-providers'] || {}).length);
  console.log("==================");
}
