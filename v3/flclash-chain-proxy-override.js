// FlClash 链式代理覆写脚本
// 功能：基于 chain-proxy-config.js 覆写，补全代理组、规则集、路由规则
// 问题：chain-proxy-config.js 优先使用订阅自带的配置，导致 baseConfig 中的
//       丰富分组、规则集 URL、路由规则丢失
// 修复：使用 include-all 直接引入节点，并补全 rule-providers 和 rules
// 使用：在 FlClash 中通过 Sub-Store 脚本覆写使用此脚本
// 效果：代理组、规则集、路由规则全部补全，链式中转和链式代理正常显示

// ========================================
// 配置区域
// ========================================

// 家宽节点识别关键词
const homeProxyFilter = "家宽|Home|住宅|Residential|IPLC|Hd|SC|DMIT|CORONA";

// 链式代理组名称（必须与 chain-proxy-config.js 保持一致）
const chainProxyGroupName = "🏠 链式代理";
const dialerProxyGroupName = "🔗 链式中转";

// ========================================
// 策略组定义（使用 include-all 直接引入节点）
// ========================================

const allGroupDefinitions = [
  { name: "手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "自动选择", type: "url-test", interval: 6, tolerance: 20, lazy: true, url: "http://www.google.com/blank.html", "disable-udp": false, timeout: 2000, "max-failed-times": 3, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png" },
  { name: "GLOBAL", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Apple", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "AppStore", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/App_Store.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "BiliBili", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/bilibili_4.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Claude", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/wanswu/my-backup@main/IconSet/AI/Claude.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Cursor", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/cursor.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Disney", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Disney.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Emby", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Emby.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Gemini", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/guaishouxiaoqi/icons@master/Color/Gemini.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Grok", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/grok.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Perplexity", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/perplexity.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Github", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/GitHub.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Google", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Microsoft", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Netflix", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "OpenAI", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "OneDrive", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/OneDrive.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Steam", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Steam.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Spotify", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "TikTok", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Telegram", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Twitter", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Twitter.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "YouTube", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/YouTube.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "漏网之鱼", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Final.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "直连", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png", proxies: ["DIRECT", "REJECT"] }
];

// ========================================
// 规则集定义（rule-providers）
// ========================================

const defaultRuleProviders = {
  Apple: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Apple/Apple_Classical.yaml" },
  AppStore: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppStore/AppStore.yaml" },
  BiliBili: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BiliBili/BiliBili.yaml" },
  China: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/China/China_Classical_No_Resolve.yaml" },
  Claude: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Claude/Claude.yaml" },
  Disney: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Disney/Disney.yaml" },
  Emby: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Emby/Emby.yaml" },
  Gemini: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Gemini/Gemini.yaml" },
  Github: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GitHub/GitHub.yaml" },
  Google: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Google/Google.yaml" },
  Hijacking: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Hijacking/Hijacking.yaml" },
  Lan: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Lan/Lan_No_Resolve.yaml" },
  Microsoft: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Microsoft/Microsoft.yaml" },
  Netflix: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix.yaml" },
  OpenAI: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OpenAI/OpenAI.yaml" },
  OneDrive: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OneDrive/OneDrive.yaml" },
  Steam: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Steam/Steam.yaml" },
  Spotify: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Spotify/Spotify.yaml" },
  TikTok: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/TikTok/TikTok.yaml" },
  Twitter: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Twitter/Twitter.yaml" },
  Telegram: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Telegram/Telegram.yaml" },
  YouTube: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouTube/YouTube.yaml" },
  DNSLeak: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/wanswu/my-backup@master/clash/rule/DNSLeak.yaml" }
};

// ========================================
// 路由规则定义
// ========================================

const defaultRules = [
  "DOMAIN-SUFFIX,account.listary.com,REJECT",
  "DOMAIN-SUFFIX,auth.listary.com,REJECT",
  "DOMAIN-SUFFIX,api.getfiddler.com,REJECT",
  "DOMAIN-SUFFIX,portal101.cn,直连",
  "DOMAIN-SUFFIX,javasec.org,直连",
  "DOMAIN-SUFFIX,grok.com,Grok",
  "DOMAIN-SUFFIX,x.ai,Grok",
  "DOMAIN-SUFFIX,perplexity.ai,Perplexity",
  "DOMAIN-SUFFIX,pplx.ai,Perplexity",
  "DOMAIN-KEYWORD,perplexity,Perplexity",
  "DOMAIN-SUFFIX,cursor-cdn.com,Cursor",
  "DOMAIN-SUFFIX,cursor.com,Cursor",
  "DOMAIN-SUFFIX,cursor.sh,Cursor",
  "DOMAIN-SUFFIX,cursorapi.com,Cursor",
  "DOMAIN-KEYWORD,cursor,Cursor",
  "PROCESS-NAME,prl_naptd,漏网之鱼",
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
  "RULE-SET,AppStore,AppStore",
  "RULE-SET,Claude,Claude",
  "RULE-SET,Steam,Steam",
  "RULE-SET,Emby,Emby",
  "RULE-SET,Hijacking,DIRECT",
  "MATCH,漏网之鱼"
];

// ========================================
// 脚本主函数
// ========================================

function main(config) {
  console.log("🚀 FlClash 链式代理覆写开始...");

  // 1. 获取现有代理组
  var proxyGroups = config['proxy-groups'] || [];
  var existingNames = proxyGroups.map(function(g) { return g.name; });

  // 2. 检查是否已有链式代理组
  var hasChainGroup = existingNames.indexOf(chainProxyGroupName) !== -1;
  var hasDialerGroup = existingNames.indexOf(dialerProxyGroupName) !== -1;

  // 3. 如果没有链式代理组，创建它们
  if (!hasChainGroup || !hasDialerGroup) {
    var proxies = config.proxies || [];

    var homeProxies = proxies.filter(function(proxy) {
      if (!homeProxyFilter) return false;
      var regex = new RegExp(homeProxyFilter, 'i');
      try {
        var decodedName = decodeURIComponent(proxy.name);
        return regex.test(proxy.name) || regex.test(decodedName);
      } catch (e) {
        return regex.test(proxy.name);
      }
    });

    if (homeProxies.length > 0) {
      var chainHomeProxies = homeProxies.map(function(proxy) {
        var clonedProxy = JSON.parse(JSON.stringify(proxy));
        clonedProxy.name = '🔗 ' + proxy.name;
        clonedProxy['dialer-proxy'] = dialerProxyGroupName;
        return clonedProxy;
      });

      var proxyNames = proxies.map(function(p) { return p.name; });
      chainHomeProxies.forEach(function(p) {
        if (proxyNames.indexOf(p.name) === -1) {
          proxies.push(p);
        }
      });
      config.proxies = proxies;

      if (!hasDialerGroup) {
        proxyGroups.unshift({
          name: dialerProxyGroupName, type: 'select', hidden: false,
          icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png',
          'include-all': true, 'exclude-filter': '🔗|DIRECT|REJECT'
        });
      }
      if (!hasChainGroup) {
        proxyGroups.unshift({
          name: chainProxyGroupName, type: 'select', hidden: false,
          icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png',
          proxies: chainHomeProxies.map(function(p) { return p.name; })
        });
      }
    }
  }

  // 4. 补全缺失的代理组
  existingNames = proxyGroups.map(function(g) { return g.name; });

  allGroupDefinitions.forEach(function(def) {
    if (existingNames.indexOf(def.name) === -1) {
      var newGroup = JSON.parse(JSON.stringify(def));
      if (newGroup['include-all']) { newGroup['exclude-filter'] = '🔗'; }
      newGroup.hidden = (newGroup.name === "自动选择");
      proxyGroups.push(newGroup);
    }
  });

  // 5. 将所有策略组的 proxies 加上链式代理选项
  var policyGroups = ["手动选择", "GLOBAL", "Apple", "AppStore", "BiliBili",
    "Claude", "Cursor", "Disney", "Emby", "Gemini", "Grok", "Perplexity",
    "Github", "Google", "Microsoft", "Netflix", "OpenAI", "OneDrive", "Steam",
    "Spotify", "TikTok", "Telegram", "Twitter", "YouTube", "漏网之鱼"];

  proxyGroups.forEach(function(g) {
    if (policyGroups.indexOf(g.name) !== -1) {
      if (g.proxies && g.proxies.indexOf(chainProxyGroupName) === -1) {
        g.proxies.unshift(chainProxyGroupName);
      }
    }
  });

  // 6. 确保链式代理组可见
  proxyGroups.forEach(function(g) {
    if (g.name === dialerProxyGroupName || g.name === chainProxyGroupName) {
      g.hidden = false;
    }
  });

  config['proxy-groups'] = proxyGroups;

  // 7. 补全 rule-providers
  var currentProviders = config['rule-providers'] || {};
  Object.keys(defaultRuleProviders).forEach(function(key) {
    if (!currentProviders[key]) {
      currentProviders[key] = defaultRuleProviders[key];
    }
  });
  config['rule-providers'] = currentProviders;

  // 8. 补全路由规则
  var currentRules = config.rules || [];
  if (currentRules.length < 5) {
    config.rules = defaultRules;
  } else {
    defaultRules.forEach(function(rule) {
      if (currentRules.indexOf(rule) === -1) {
        currentRules.push(rule);
      }
    });
    config.rules = currentRules;
  }

  console.log("🎉 FlClash 链式代理覆写完成！代理组: " + proxyGroups.length);

  return config;
}
