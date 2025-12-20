// Mihomo 链式代理完整配置脚本
// 功能：合并了基础配置和链式代理扩展功能
// 使用：订阅中已包含家宽节点，AI 服务走【机场中转 → 家宽落地】

// ========================================
// 配置区域（需要根据实际情况修改）
// ========================================

// 家宽节点识别关键词（用于从订阅中筛选家宽节点）
// 支持正则表达式，多个关键词用 | 分隔
const homeProxyFilter = "家宽|Home|住宅|Residential|IPLC|Hd|SC";

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
  ipv6: true,
  "mixed-port": 7890,
  "allow-lan": true,
  "bind-address": "0.0.0.0",
  "log-level": "error",
  "unified-delay": true,
  "find-process-mode": "strict",
  "global-client-fingerprint": "chrome",
  listeners: [
    { name: "fp-1", type: "mixed", listen: "127.0.0.1", port: 7911, proxy: "指纹浏览器-1-7911" },
    { name: "fp-2", type: "mixed", listen: "127.0.0.1", port: 7912, proxy: "指纹浏览器-2-7912" },
    { name: "fp-3", type: "mixed", listen: "127.0.0.1", port: 7913, proxy: "指纹浏览器-3-7913" }
  ],

  // 规则选择缓存
  profile: {
    "store-selected": true,
    "store-fake-ip": true
  },

  "tcp-concurrent": true,
  "keep-alive-interval": 15,
  "keep-alive-idle": 15,
  "disable-keep-alive": true,

  // DNS 配置（融合优化版）
  dns: {
    enable: true,
    listen: "0.0.0.0:1053", // 如需局域网设备使用这个DNS，取消注释
    ipv6: true,
    "prefer-h3": false,
    "respect-rules": true, // 尊重分流规则，DNS 查询也会遵循代理规则
    "use-hosts": false,
    "use-system-hosts": false,
    "cache-algorithm": "arc", // 使用 ARC 缓存算法，性能更好
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
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
      "223.5.5.5",
      "1.2.4.8"
    ],
    // 国外 DNS 服务器（代理流量使用）
    nameserver: [
      "https://1.1.1.1/dns-query", // Cloudflare
      "https://cloudflare-dns.com/dns-query",
      "https://dns.google.com/dns-query", // Google
      "https://8.8.4.4/dns-query",
      "https://208.67.222.222/dns-query", // OpenDNS
      "https://9.9.9.9/dns-query" // Quad9
    ],
    // 代理服务器节点解析使用国内 DNS（避免污染）
    "proxy-server-nameserver": [
      "https://223.5.5.5/dns-query",
      "https://doh.pub/dns-query"
    ],
    // 直连流量使用国内 DNS
    "direct-nameserver": [
      "https://doh.pub/dns-query",
      "https://223.5.5.5/dns-query",
      "https://dns.alidns.com/dns-query"
    ],
    "direct-nameserver-follow-policy": false,
    // 国内域名使用国内 DNS
    "nameserver-policy": {
      "geosite:cn": [
        "https://223.5.5.5/dns-query",
        "https://doh.pub/dns-query"
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
    enable: false,
    stack: "mixed",
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
    enable: false,
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
    {
      name: "指纹浏览器-1-7911",
      type: "select",
      "include-all": true,
      proxies: ["手动选择", "自动选择", "DIRECT", "REJECT"]
    },
    {
      name: "指纹浏览器-2-7912",
      type: "select",
      "include-all": true,
      proxies: ["手动选择", "自动选择", "DIRECT", "REJECT"]
    },
    {
      name: "指纹浏览器-3-7913",
      type: "select",
      "include-all": true,
      proxies: ["手动选择", "自动选择", "DIRECT", "REJECT"]
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
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
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
      name: "Claude",
      type: "select",
      "disable-udp": false,
      icon: "https://testingcf.jsdelivr.net/gh/wanswu/my-backup@main/IconSet/AI/Claude.png",
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
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png",
      filter: "🇭🇰|香港|港|HK|hongkong|hong kong"
    },

    {
      name: "澳门",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Macao.png",
      filter: "🇲🇴|澳门|门|MO|macao"
    },

    {
      name: "台湾",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png",
      filter: "🇹🇼|台湾|台|TW|taiwan|taipei"
    },

    {
      name: "日本",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png",
      filter: "🇯🇵|日本|JP|japan|tokyo|osaka"
    },

    {
      name: "韩国",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Korea.png",
      filter: "🇰🇷|韩国|韩|KR|korea|seoul"
    },

    {
      name: "美国",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png",
      filter: "🇺🇸|美国|美|US|united states|america|los angeles|san jose|silicon valley"
    },

    {
      name: "英国",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Kingdom.png",
      filter: "🇬🇧|英国|英|UK|united kingdom|london"
    },

    {
      name: "德国",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Germany.png",
      filter: "🇩🇪|德国|德|DE|germany|frankfurt"
    },

    {
      name: "法国",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/France.png",
      filter: "🇫🇷|法国|法|FR|france|paris"
    },

    {
      name: "印度",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/India.png",
      filter: "🇮🇳|印度|IN|india|mumbai"
    },

    {
      name: "新加坡",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png",
      filter: "🇸🇬|新加坡|新|SG|singapore"
    },

    {
      name: "印尼",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/wanswu/my-backup@master/IconSet/Country/Indonesia.png",
      filter: "🇮🇩|印尼|印度尼西亚|ID|indonesia|jakarta"
    },

    {
      name: "越南",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/wanswu/my-backup@master/IconSet/Country/Vietnam.png",
      filter: "🇻🇳|越南|VN|vietnam"
    },

    {
      name: "泰国",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Thailand.png",
      filter: "🇹🇭|泰国|TH|thailand|bangkok"
    },

    {
      name: "澳洲",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Australia.png",
      filter: "🇦🇺|澳大利亚|AU|australia|sydney"
    },

    {
      name: "巴西",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Brazil.png",
      filter: "🇧🇷|巴西|brazil"
    },

    {
      name: "其他",
      type: "url-test",
      interval: 6,
      tolerance: 20,
      lazy: true,
      url: "http://www.google.com/blank.html",
      "disable-udp": false,
      timeout: 2000,
      "max-failed-times": 3,
      hidden: true,
      "include-all": true,
      icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
      filter: "(?i)^(?!.*(香港|台湾|日本|韩国|新加坡|美国|英国|德国|法国|印度|泰国|越南|印尼|澳大利亚|巴西|港|台|日|韩|新|美|英|德|法|印|泰|越|尼|澳|巴|hk|tw|jp|kr|sg|us|uk|de|fr|in|th|vn|id|au|br)).*"
    }
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
    BiliBili: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BiliBili/BiliBili.yaml"
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
    DNSLeak: {
      type: "http",
      behavior: "classical",
      interval: 3600,
      format: "yaml",
      proxy: "DIRECT",
      url: "https://testingcf.jsdelivr.net/gh/wanswu/my-backup@master/clash/rule/DNSLeak.yaml"
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

    // Perplexity 域名规则
    "DOMAIN-SUFFIX,perplexity.ai,Perplexity",
    "DOMAIN-SUFFIX,pplx.ai,Perplexity",
    "DOMAIN-KEYWORD,perplexity,Perplexity",

    // Cursor 域名规则
    "DOMAIN-SUFFIX,cursor-cdn.com,Cursor",
    "DOMAIN-SUFFIX,cursor.com,Cursor",
    "DOMAIN-SUFFIX,cursor.sh,Cursor",
    "DOMAIN-SUFFIX,cursorapi.com,Cursor",
    "DOMAIN-KEYWORD,cursor,Cursor",

    // 进程规则
    "PROCESS-NAME,prl_naptd,漏网之鱼",

    // 规则集匹配
    "RULE-SET,Lan,直连,no-resolve",
    "RULE-SET,DNSLeak,手动选择",
    "RULE-SET,Microsoft,Microsoft",
    "RULE-SET,China,直连,no-resolve",
    "RULE-SET,Telegram,Telegram",
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
    "RULE-SET,Claude,Claude",
    "RULE-SET,Steam,Steam",
    "RULE-SET,Emby,Emby",
    "RULE-SET,Hijacking,DIRECT",

    // 兜底规则
    "MATCH,漏网之鱼"
  ]
};

// ========================================
// 脚本主函数
// ========================================

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

  // 1. 获取所有节点
  const proxies = config.proxies || [];
  console.log(`📡 总节点数: ${proxies.length}`);

  // 2. 识别家宽节点
  const homeProxies = proxies.filter(proxy => {
    const regex = new RegExp(homeProxyFilter, 'i');
    return regex.test(proxy.name);
  });

  if (homeProxies.length === 0) {
    console.warn("⚠️  未找到家宽节点，请检查 homeProxyFilter 配置！");
    console.log(`当前过滤规则: ${homeProxyFilter}`);
    return config;
  }

  console.log(`🏠 识别到 ${homeProxies.length} 个家宽节点:`);
  homeProxies.forEach(p => console.log(`   - ${p.name}`));

  // 3. 为链式代理创建家宽节点的克隆（带 dialer-proxy）
  const chainHomeProxies = homeProxies.map(proxy => {
    const clonedProxy = JSON.parse(JSON.stringify(proxy)); // 深拷贝
    clonedProxy.name = '🔗 ' + proxy.name; // 添加前缀区分
    clonedProxy['dialer-proxy'] = dialerProxyGroupName;
    return clonedProxy;
  });

  // 将克隆的链式家宽节点添加到 proxies 列表
  proxies.push(...chainHomeProxies);
  console.log(`✅ 已创建 ${chainHomeProxies.length} 个链式家宽节点（带 dialer-proxy）`);
  chainHomeProxies.forEach(p => console.log(`   - ${p.name}`));

  config.proxies = proxies;

  // 4. 创建代理组
  const proxyGroups = config['proxy-groups'] || [];

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

  // 5. 将链式代理添加到手动选择组（可选）
  if (addToManualSelect) {
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
  const aiGroups = ["指纹浏览器-1-7911", "指纹浏览器-2-7912", "指纹浏览器-3-7913", "手动选择", "GLOBAL", "Apple", "BiliBili", "Claude", "Cursor", "Disney", "Emby", "Gemini", "Perplexity", "Github", "Google", "Microsoft", "Netflix", "OpenAI", "OneDrive", "Steam", "Spotify", "TikTok", "Telegram", "Twitter", "YouTube", "漏网之鱼"]
  aiGroups.forEach(groupName => {
    const group = proxyGroups.find(g => g.name === groupName);
    if (group && group.proxies) {
      // 将链式代理放到第一位（默认选择）
      group.proxies = [chainProxyGroupName, ...group.proxies.filter(p => p !== chainProxyGroupName)];
      console.log(`✅ ${groupName} 默认使用链式代理`);
    }
  });

  // 7. 不排除家宽节点，让所有组都能看到原始家宽节点
  // 但排除克隆的链式家宽节点（🔗 前缀），避免重复
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

  config['proxy-groups'] = proxyGroups;

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

  console.log("🎉 链式代理配置完成！");
  console.log("\n使用说明：");
  console.log(`1. 在 ${dialerProxyGroupName} 中选择机场中转节点`);
  console.log(`2. 在 ${chainProxyGroupName} 中选择家宽落地节点（链式代理组）`);
  console.log("3. AI 服务走各自的策略组（OpenAI/Gemini/Claude等）");
  console.log(`4. 这些策略组默认选项是 ${chainProxyGroupName}，可手动切换`);
  console.log("5. 如需使用链式代理，在对应策略组中选择 🏠 链式代理\n");

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
