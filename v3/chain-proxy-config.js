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
  "find-process-mode": "strict",

  // 规则选择缓存
  profile: {
    "store-selected": true,
    "store-fake-ip": true
  },

  "tcp-concurrent": true,
  "keep-alive-interval": 15,
  "keep-alive-idle": 15,
  "disable-keep-alive": true,

  // DNS 配置（防泄露优化版 - 参考 lvbibir/mihomo.yaml）
  dns: {
    enable: true,
    listen: "127.0.0.1:1053",
    ipv6: false,
    "prefer-h3": false,
    "respect-rules": true, // 尊重分流规则，DNS 查询也会遵循代理规则
    "use-hosts": true,
    "use-system-hosts": false,
    "cache-algorithm": "arc", // 使用 ARC 缓存算法，性能更好
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-filter-mode": "blacklist",
    "fake-ip-filter": [
      // 本地主机/设备
      "+.lan",
      "+.local",
      // Windows网络检测
      "+.msftconnecttest.com",
      "+.msftncsi.com",
      // QQ/微信快速登录
      "localhost.ptlogin2.qq.com",
      "localhost.sec.qq.com",
      "localhost.work.weixin.qq.com"
    ],
    "default-nameserver": [
      "tls://223.5.5.5:853",
      "https://223.5.5.5/dns-query"
    ],
    // 国外 DNS 默认跟随漏网之鱼策略组
    nameserver: [
      "https://1.1.1.1/dns-query#漏网之鱼", // Cloudflare
      "https://dns.google/dns-query#漏网之鱼" // Google
    ],
    // 代理服务器节点解析使用国内 DNS（避免污染）
    "proxy-server-nameserver": [
      "https://223.5.5.5/dns-query#DIRECT",
      "https://doh.pub/dns-query#DIRECT"
    ],
    // 直连流量使用国内 DNS
    "direct-nameserver": [
      "https://doh.pub/dns-query#DIRECT",
      "https://223.5.5.5/dns-query#DIRECT",
      "https://dns.alidns.com/dns-query#DIRECT"
    ],
    "direct-nameserver-follow-policy": true,
    // DNS 与业务策略组联动，切换策略组时 DNS 出口同步切换
    "nameserver-policy": {
      "geosite:cn": [
        "https://223.5.5.5/dns-query#DIRECT",
        "https://doh.pub/dns-query#DIRECT"
      ],
      "rule-set:OpenAI": [
        "https://1.1.1.1/dns-query#OpenAI",
        "https://dns.google/dns-query#OpenAI"
      ],
      "rule-set:Claude": [
        "https://1.1.1.1/dns-query#Claude",
        "https://dns.google/dns-query#Claude"
      ],
      "rule-set:Facebook": [
        "https://1.1.1.1/dns-query#Facebook",
        "https://dns.google/dns-query#Facebook"
      ],
      "rule-set:Gemini": [
        "https://1.1.1.1/dns-query#Gemini",
        "https://dns.google/dns-query#Gemini"
      ],
      "geosite:ookla-speedtest": [
        "https://1.1.1.1/dns-query#Speedtest",
        "https://dns.google/dns-query#Speedtest"
      ],
      "rule-set:Speedtest": [
        "https://1.1.1.1/dns-query#Speedtest",
        "https://dns.google/dns-query#Speedtest"
      ],
      "+.oca.nflxvideo.net": [
        "https://1.1.1.1/dns-query#Speedtest",
        "https://dns.google/dns-query#Speedtest"
      ],
      "rule-set:Bybit": [
        "https://1.1.1.1/dns-query#Bybit",
        "https://dns.google/dns-query#Bybit"
      ],
      "+.bybit.eu": [
        "https://1.1.1.1/dns-query#bybit.eu",
        "https://dns.google/dns-query#bybit.eu"
      ],
      "rule-set:kraken": [
        "https://1.1.1.1/dns-query#Kraken",
        "https://dns.google/dns-query#Kraken"
      ],
      "rule-set:wise": [
        "https://1.1.1.1/dns-query#Wise",
        "https://dns.google/dns-query#Wise"
      ],
      "rule-set:okx": [
        "https://1.1.1.1/dns-query#OKX",
        "https://dns.google/dns-query#OKX"
      ],
      "rule-set:paypal": [
        "https://1.1.1.1/dns-query#PayPal",
        "https://dns.google/dns-query#PayPal"
      ],
      "rule-set:binance": [
        "https://1.1.1.1/dns-query#Binance",
        "https://dns.google/dns-query#Binance"
      ],
      "rule-set:monzo": [
        "https://1.1.1.1/dns-query#Monzo",
        "https://dns.google/dns-query#Monzo"
      ],
      "rule-set:revolut": [
        "https://1.1.1.1/dns-query#Revolut",
        "https://dns.google/dns-query#Revolut"
      ],
      "+.grok.com,+.x.ai": [
        "https://1.1.1.1/dns-query#Grok",
        "https://dns.google/dns-query#Grok"
      ],
      "geosite:private": [
        "system://"
      ]
    }
  },

  // GEO 配置
  "geodata-mode": true,
  "geo-auto-update": true,
  "geo-update-interval": 24,
  "geodata-loader": "memconservative",
  "geox-url": {
    geoip: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat",
    geosite: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
    mmdb: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb",
    asn: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb"
  },

  // 主机名映射 - 强制 DoH 域名走指定 IP，避免 DNS 解析死循环
  hosts: {
    "dns.alidns.com": ["223.5.5.5", "223.6.6.6"],
    "doh.pub": ["1.12.12.12", "120.53.53.53"],
    "dns.google": ["8.8.8.8", "8.8.4.4"],
    "cloudflare-dns.com": ["1.1.1.1", "1.0.0.1"]
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
    "auto-redirect": false,
    "auto-detect-interface": true,
    "dns-hijack": [
      "any:53",
      "tcp://any:53"
    ],
    "route-exclude-address": [],
    mtu: 1500
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
      interval: 60,
      tolerance: 80,
      lazy: true,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
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
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/bybit.png",
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
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png",
      filter: "🇭🇰|香港|港|HK|hongkong|hong kong"
    },

    {
      name: "澳门",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Macao.png",
      filter: "🇲🇴|澳门|门|MO|macao"
    },

    {
      name: "台湾",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png",
      filter: "🇹🇼|台湾|台|TW|taiwan|taipei"
    },

    {
      name: "日本",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png",
      filter: "🇯🇵|日本|JP|japan|tokyo|osaka"
    },

    {
      name: "韩国",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Korea.png",
      filter: "🇰🇷|韩国|韩|KR|korea|seoul"
    },

    {
      name: "美国",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png",
      filter: "🇺🇸|美国|美|US|united states|america|los angeles|san jose|silicon valley"
    },

    {
      name: "英国",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Kingdom.png",
      filter: "🇬🇧|英国|英|UK|united kingdom|london"
    },

    {
      name: "德国",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Germany.png",
      filter: "🇩🇪|德国|德|DE|germany|frankfurt"
    },

    {
      name: "法国",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/France.png",
      filter: "🇫🇷|法国|法|FR|france|paris"
    },

    {
      name: "印度",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/India.png",
      filter: "🇮🇳|印度|IN|india|mumbai"
    },

    {
      name: "新加坡",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png",
      filter: "🇸🇬|新加坡|新|SG|singapore"
    },

    {
      name: "印尼",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/indonesia.png",
      filter: "🇮🇩|印尼|印度尼西亚|ID|indonesia|jakarta"
    },

    {
      name: "越南",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/vietnam.png",
      filter: "🇻🇳|越南|VN|vietnam"
    },

    {
      name: "泰国",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Thailand.png",
      filter: "🇹🇭|泰国|TH|thailand|bangkok"
    },

    {
      name: "澳洲",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Australia.png",
      filter: "🇦🇺|澳大利亚|AU|australia|sydney"
    },

    {
      name: "巴西",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Brazil.png",
      filter: "🇧🇷|巴西|brazil"
    },

    {
      name: "其他",
      type: "url-test",
      interval: 30,
      tolerance: 80,
      lazy: false,
      url: "https://www.gstatic.com/generate_204",
      "disable-udp": false,
      timeout: 1500,
      "max-failed-times": 2,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
      filter: "(?i)^(?!.*(香港|台湾|日本|韩国|新加坡|美国|英国|德国|法国|印度|泰国|越南|印尼|澳大利亚|巴西|港|台|日|韩|新|美|英|德|法|印|泰|越|尼|澳|巴|hk|tw|jp|kr|sg|us|uk|de|fr|in|th|vn|id|au|br)).*"
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
    "DOMAIN-SUFFIX,account.listary.com,REJECT",
    "DOMAIN-SUFFIX,auth.listary.com,REJECT",
    "DOMAIN-SUFFIX,api.getfiddler.com,REJECT",

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
    "DOMAIN-SUFFIX,bybit.eu,bybit.eu",
    "DOMAIN-SUFFIX,krak.app,英国手动选择",

    // iFast 域名规则
    "RULE-SET,ifast,直连",

    // Cloudbet 域名规则 - 默认走日本
    "DOMAIN-SUFFIX,cloudbet.com,日本",
    "DOMAIN-SUFFIX,cldbt.cloud,日本",
    "DOMAIN-SUFFIX,sports-api.cloudbet.com,日本",
    "DOMAIN-SUFFIX,api.cloudbet.com,日本",
    "DOMAIN-SUFFIX,cdn.cloudbet.com,日本",
    "DOMAIN-SUFFIX,media.cloudbet.com,日本",
    "DOMAIN-SUFFIX,affiliates.cloudbet.com,日本",
    "DOMAIN-SUFFIX,play-cloudbet.com,日本",
    "DOMAIN-SUFFIX,share.cloudbet.com,日本",
    "DOMAIN-SUFFIX,a.cloudbet.com,日本",
    "DOMAIN-SUFFIX,int.cloudbet.com,日本",
    "DOMAIN-SUFFIX,ws.cloudbet.com,日本",
    "DOMAIN-SUFFIX,wss.cloudbet.com,日本",
    "DOMAIN-KEYWORD,cloudbet,日本",

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
    "DOMAIN-KEYWORD,stake,日本",

    // 进程规则
    "PROCESS-NAME,prl_naptd,漏网之鱼",

    // 规则集匹配
    "RULE-SET,Lan,直连,no-resolve",
    "RULE-SET,Microsoft,Microsoft",
    "RULE-SET,Bybit,Bybit",
    "RULE-SET,China,直连,no-resolve",
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
  "Apple", "AppStore", "BiliBili", "Binance", "Bybit", "bybit.eu", "Claude", "Cursor",
  "Disney", "Duolingo", "Emby", "Facebook", "Gemini", "Github", "Google", "Grok",
  "Kraken", "Microsoft", "Monzo", "Netflix", "OKX", "OneDrive", "OpenAI",
  "PayPal", "Perplexity", "Revolut", "Speedtest", "Spotify", "Steam",
  "Telegram", "TikTok", "Twitter", "Wise", "YouTube"
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

  // 如果传入了外部配置，使用外部配置；否则使用内置基础配置
  if (!config || !config.proxies || config.proxies.length === 0) {
    console.log("📋 使用内置基础配置");
    config = JSON.parse(JSON.stringify(baseConfig)); // 深拷贝基础配置
  } else {
    console.log("📋 使用外部订阅配置");
    // 合并基础配置（除了 proxies 和 proxy-groups）
    const mergedConfig = JSON.parse(JSON.stringify(baseConfig));
    mergedConfig.proxies = config.proxies || [];
    mergedConfig['proxy-groups'] = config['proxy-groups'] || baseConfig['proxy-groups'];
    mergedConfig['rule-providers'] = config['rule-providers'] || baseConfig['rule-providers'];
    mergedConfig.rules = config.rules || baseConfig.rules;
    config = mergedConfig;
  }

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

    // 添加到代理组列表最前面（使用 unshift）
    proxyGroups.unshift(chainGroup);      // 🏠 链式代理 放在最前
    proxyGroups.unshift(dialerGroup);     // 🔗 链式中转 放在最前

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

  // 6. 修改应用分组，将 AI 服务默认指向链式代理
  if (hasHomeProxies) {
    const aiGroups = ["手动选择", "GLOBAL", "Apple", "AppStore", "BiliBili", "Claude", "Cursor", "Disney", "Emby", "Facebook", "Gemini", "Grok", "Perplexity", "Github", "Google", "Microsoft", "Netflix", "OpenAI", "OneDrive", "Steam", "Spotify", "TikTok", "Telegram", "Twitter", "YouTube", "漏网之鱼"]
    aiGroups.forEach(groupName => {
      const group = proxyGroups.find(g => g.name === groupName);
      if (group && group.proxies) {
        group.proxies = [chainProxyGroupName, ...group.proxies.filter(p => p !== chainProxyGroupName)];
        console.log(`✅ ${groupName} 默认使用链式代理`);
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
          group['exclude-filter'] += '|🔗';
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
