// FlClash 链式代理覆写脚本
// 功能：基于 chain-proxy-config.js 覆写，补全所有代理组并确保它们在 FlClash 中正常显示
// 问题：chain-proxy-config.js 会优先使用订阅自带的代理组，导致 baseConfig 中的丰富分组
//       （如 Gemini、Google、Claude 等）丢失，FlClash 只显示链式中转和链式代理
// 使用：在 FlClash 中通过 Sub-Store 脚本覆写使用此脚本
// 效果：补全所有代理组，链式中转和链式代理正常显示，Gemini/Google/Claude 等也正常显示

// ========================================
// 配置区域
// ========================================

// 家宽节点识别关键词
const homeProxyFilter = "家宽|Home|住宅|Residential|IPLC|Hd|SC|DMIT|CORONA";

// 链式代理组名称（必须与 chain-proxy-config.js 保持一致）
const chainProxyGroupName = "🏠 链式代理";
const dialerProxyGroupName = "🔗 链式中转";

// ========================================
// 完整的代理组定义（来自 chain-proxy-config.js 的 baseConfig）
// 这些组在 chain-proxy-config.js 合并时可能被订阅的组覆盖，需要在此补全
// ========================================

const fullProxyGroups = [
  // 手动选择
  {
    name: "手动选择",
    type: "select",
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png",
    "include-all": true,
    proxies: [
      "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // 自动选择
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

  // GLOBAL
  {
    name: "GLOBAL",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Apple
  {
    name: "Apple",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // AppStore
  {
    name: "AppStore",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/App_Store.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // BiliBili
  {
    name: "BiliBili",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/bilibili_4.png",
    "include-all": true,
    proxies: [
      "DIRECT", "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "REJECT"
    ]
  },

  // Claude
  {
    name: "Claude",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/wanswu/my-backup@main/IconSet/AI/Claude.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Cursor
  {
    name: "Cursor",
    type: "select",
    "disable-udp": false,
    icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/cursor.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Disney
  {
    name: "Disney",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Disney.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Emby
  {
    name: "Emby",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Emby.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Gemini
  {
    name: "Gemini",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/guaishouxiaoqi/icons@master/Color/Gemini.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Grok
  {
    name: "Grok",
    type: "select",
    "disable-udp": false,
    icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/grok.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Perplexity
  {
    name: "Perplexity",
    type: "select",
    "disable-udp": false,
    icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/perplexity.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Github
  {
    name: "Github",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/GitHub.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Google
  {
    name: "Google",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Microsoft
  {
    name: "Microsoft",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Netflix
  {
    name: "Netflix",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // OpenAI
  {
    name: "OpenAI",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // OneDrive
  {
    name: "OneDrive",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/OneDrive.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Steam
  {
    name: "Steam",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Steam.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Spotify
  {
    name: "Spotify",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // TikTok
  {
    name: "TikTok",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Telegram
  {
    name: "Telegram",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // Twitter
  {
    name: "Twitter",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Twitter.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // YouTube
  {
    name: "YouTube",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/YouTube.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他", "DIRECT", "REJECT"
    ]
  },

  // 漏网之鱼
  {
    name: "漏网之鱼",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Final.png",
    "include-all": true,
    proxies: [
      "手动选择", "自动选择", "DIRECT", "REJECT",
      "香港", "澳门", "台湾", "日本", "韩国",
      "美国", "英国", "德国", "法国", "印度",
      "新加坡", "印尼", "越南", "泰国", "澳洲",
      "巴西", "其他"
    ]
  },

  // 直连
  {
    name: "直连",
    type: "select",
    "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png",
    proxies: ["DIRECT", "手动选择", "REJECT"]
  },

  // 香港
  {
    name: "香港",
    type: "url-test",
    interval: 600,
    tolerance: 50,
    lazy: true,
    url: "http://www.google.com/blank.html",
    "disable-udp": false,
    timeout: 2000,
    "max-failed-times": 3,
    hidden: true,
    filter: "港|HK|Hong|🇭🇰",
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png"
  },
  { name: "澳门", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "澳|Macau|🇲🇴", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Macau.png" },
  { name: "台湾", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "台|Taiwan|🇹🇼", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png" },
  { name: "日本", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "日|Japan|🇯🇵", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png" },
  { name: "韩国", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "韩|Korea|🇰🇷", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/South_Korea.png" },
  { name: "美国", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "美|United States|🇺🇸", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png" },
  { name: "英国", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "英|United Kingdom|🇬🇧", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Kingdom.png" },
  { name: "德国", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "德|Germany|🇩🇪", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Germany.png" },
  { name: "法国", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "法|France|🇫🇷", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/France.png" },
  { name: "印度", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "印|India|🇮🇳", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/India.png" },
  { name: "新加坡", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "新加坡|Singapore|🇸🇬", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png" },
  { name: "印尼", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "印尼|Indonesia|🇮🇩", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Indo.png" },
  { name: "越南", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "越|Vietnam|🇻🇳", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Vietnam.png" },
  { name: "泰国", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "泰|Thailand|🇹🇭", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Thailand.png" },
  { name: "澳洲", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "澳|Australia|🇦🇺", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Australia.png" },
  { name: "巴西", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, filter: "巴西|Brazil|🇧🇷", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Brazil.png" },
  { name: "其他", type: "url-test", interval: 600, tolerance: 50, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Unknown.png" }
];

// ========================================
// 脚本主函数
// ========================================

function main(config) {
  console.log("🚀 FlClash 链式代理覆写开始...");

  // 1. 获取现有代理组
  const proxyGroups = config['proxy-groups'] || [];
  const existingNames = proxyGroups.map(g => g.name);

  // 2. 检查是否已有链式代理组
  const hasChainGroup = existingNames.includes(chainProxyGroupName);
  const hasDialerGroup = existingNames.includes(dialerProxyGroupName);

  // 3. 补全缺失的代理组：将 fullProxyGroups 中不存在于当前配置的组添加进去
  const addedGroups = [];
  fullProxyGroups.forEach(groupDef => {
    if (!existingNames.includes(groupDef.name)) {
      // 深拷贝避免引用问题
      const newGroup = JSON.parse(JSON.stringify(groupDef));
      // 确保 hidden 正确设置（对于地区分组和自动选择保持 hidden: true）
      // 对于用户可见的策略组，不需要 hidden
      if (newGroup.name === "自动选择" || newGroup.name === "香港" || newGroup.name === "澳门" ||
          newGroup.name === "台湾" || newGroup.name === "日本" || newGroup.name === "韩国" ||
          newGroup.name === "美国" || newGroup.name === "英国" || newGroup.name === "德国" ||
          newGroup.name === "法国" || newGroup.name === "印度" || newGroup.name === "新加坡" ||
          newGroup.name === "印尼" || newGroup.name === "越南" || newGroup.name === "泰国" ||
          newGroup.name === "澳洲" || newGroup.name === "巴西" || newGroup.name === "其他") {
        newGroup.hidden = true;
      } else {
        newGroup.hidden = false;
      }
      proxyGroups.push(newGroup);
      addedGroups.push(newGroup.name);
    }
  });

  if (addedGroups.length > 0) {
    console.log(`✅ 已补全 ${addedGroups.length} 个缺失的代理组: ${addedGroups.join(', ')}`);
  } else {
    console.log("ℹ️ 所有代理组均已存在，无需补全");
  }

  // 4. 确保所有代理组的 hidden 属性正确
  proxyGroups.forEach(group => {
    // 链式代理相关组始终可见
    if (group.name === chainProxyGroupName || group.name === dialerProxyGroupName) {
      group.hidden = false;
      return;
    }
    // 如果组已有明确的 hidden 设置，保持不变；否则默认不隐藏
    if (group.hidden === undefined) {
      // 地区分组和自动选择默认隐藏
      const autoHiddenGroups = ["自动选择", "香港", "澳门", "台湾", "日本", "韩国",
        "美国", "英国", "德国", "法国", "印度",
        "新加坡", "印尼", "越南", "泰国", "澳洲", "巴西", "其他"];
      group.hidden = autoHiddenGroups.includes(group.name);
    }
  });

  // 5. 如果没有链式代理组，创建它们
  if (!hasChainGroup || !hasDialerGroup) {
    const proxies = config.proxies || [];
    console.log(`📡 总节点数: ${proxies.length}`);

    // 识别家宽节点
    const homeProxies = proxies.filter(proxy => {
      if (!homeProxyFilter) return false;
      const regex = new RegExp(homeProxyFilter, 'i');
      try {
        const decodedName = decodeURIComponent(proxy.name);
        return regex.test(proxy.name) || regex.test(decodedName);
      } catch (e) {
        return regex.test(proxy.name);
      }
    });

    if (homeProxies.length > 0) {
      console.log(`🏠 识别到 ${homeProxies.length} 个家宽节点`);

      // 创建链式落地节点
      const chainHomeProxies = homeProxies.map(proxy => {
        const clonedProxy = JSON.parse(JSON.stringify(proxy));
        clonedProxy.name = '🔗 ' + proxy.name;
        clonedProxy['dialer-proxy'] = dialerProxyGroupName;
        return clonedProxy;
      });

      // 添加链式落地节点
      const proxyNames = proxies.map(p => p.name);
      const newChainProxies = chainHomeProxies.filter(p => !proxyNames.includes(p.name));
      if (newChainProxies.length > 0) {
        proxies.push(...newChainProxies);
        console.log(`✅ 已创建 ${newChainProxies.length} 个链式落地节点`);
      }
      config.proxies = proxies;

      // 创建并插入链式代理组
      if (!hasDialerGroup) {
        proxyGroups.unshift({
          name: dialerProxyGroupName,
          type: 'select',
          hidden: false,
          icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png',
          'include-all': true,
          'exclude-filter': '🔗|DIRECT|REJECT'
        });
      }
      if (!hasChainGroup) {
        proxyGroups.unshift({
          name: chainProxyGroupName,
          type: 'select',
          hidden: false,
          icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png',
          proxies: chainHomeProxies.map(p => p.name)
        });
      }
      console.log("✅ 已创建链式代理组");
    } else {
      console.warn("⚠️ 未找到家宽节点");
    }
  }

  // 6. 为非链式代理组添加排除规则
  proxyGroups.forEach(group => {
    if (group.name === chainProxyGroupName || group.name === dialerProxyGroupName) return;
    if (group['include-all'] || group.filter) {
      if (group['exclude-filter']) {
        if (!group['exclude-filter'].includes('🔗')) {
          group['exclude-filter'] += '|🔗';
        }
      } else {
        group['exclude-filter'] = '🔗';
      }
    }
  });

  config['proxy-groups'] = proxyGroups;

  console.log(`🎉 FlClash 链式代理覆写完成！`);
  console.log(`   代理组总数: ${proxyGroups.length}`);
  console.log(`   可见组: ${proxyGroups.filter(g => !g.hidden).map(g => g.name).join(', ')}`);
  console.log(`   隐藏组: ${proxyGroups.filter(g => g.hidden).map(g => g.name).join(', ')}`);

  return config;
}