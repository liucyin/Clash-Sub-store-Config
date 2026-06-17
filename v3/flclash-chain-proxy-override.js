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
  { name: "Bybit", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/bybit.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Claude", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/claude.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Cursor", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/cursor.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Disney", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Disney.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Duolingo", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/duolingo.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
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
  { name: "直连", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png", proxies: ["DIRECT", "REJECT"] },
  { name: "香港手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png", "include-all": true, "exclude-filter": "🔗", filter: "🇭🇰|香港|港|HK|hongkong|hong kong", proxies: ["DIRECT", "REJECT"] },
  { name: "台湾手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png", "include-all": true, "exclude-filter": "🔗", filter: "🇹🇼|台湾|台|TW|taiwan|taipei", proxies: ["DIRECT", "REJECT"] },
  { name: "日本手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png", "include-all": true, "exclude-filter": "🔗", filter: "🇯🇵|日本|日|JP|japan|tokyo", proxies: ["DIRECT", "REJECT"] },
  { name: "新加坡手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png", "include-all": true, "exclude-filter": "🔗", filter: "🇸🇬|新加坡|新|SG|singapore", proxies: ["DIRECT", "REJECT"] },
  { name: "美国手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png", "include-all": true, "exclude-filter": "🔗", filter: "🇺🇸|美国|美|US|united states|america", proxies: ["DIRECT", "REJECT"] },
];

// ========================================
// 规则集定义（rule-providers）
// ========================================

const defaultRuleProviders = {
  Apple: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Apple/Apple_Classical.yaml" },
  AppStore: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/AppStore/AppStore.yaml" },
  BiliBili: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BiliBili/BiliBili.yaml" },
  Bybit: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/classical/bybit.yaml" },
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
  "DOMAIN-SUFFIX,deepseek.com,直连",
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
  "DOMAIN-SUFFIX,duolingo.com,Duolingo",
  "DOMAIN-SUFFIX,duolingo.cn,Duolingo",
  "DOMAIN-SUFFIX,ads-api.duolingo.com,Duolingo",
  "DOMAIN-SUFFIX,analytics.vpc.duolingo.com,Duolingo",
  "DOMAIN-SUFFIX,metrics.duolingo.com,Duolingo",
  "DOMAIN-SUFFIX,cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,cldbt.cloud,香港手动选择",
  "DOMAIN-SUFFIX,sports-api.cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,api.cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,cdn.cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,media.cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,affiliates.cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,play-cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,share.cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,a.cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,int.cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,ws.cloudbet.com,香港手动选择",
  "DOMAIN-SUFFIX,wss.cloudbet.com,香港手动选择",
  "DOMAIN-KEYWORD,cloudbet,香港手动选择",
  "DOMAIN-SUFFIX,bc.game,香港手动选择",
  "DOMAIN-SUFFIX,bc.fun,香港手动选择",
  "DOMAIN-SUFFIX,bc.app,香港手动选择",
  "DOMAIN-SUFFIX,hash.game,香港手动选择",
  "DOMAIN-SUFFIX,api.bc.game,香港手动选择",
  "DOMAIN-SUFFIX,sports.bc.game,香港手动选择",
  "DOMAIN-SUFFIX,cdn.bc.game,香港手动选择",
  "DOMAIN-SUFFIX,img.bc.game,香港手动选择",
  "DOMAIN-SUFFIX,img2.bc.game,香港手动选择",
  "DOMAIN-SUFFIX,forum.bc.game,香港手动选择",
  "DOMAIN-SUFFIX,assets.bc.game,香港手动选择",
  "DOMAIN-SUFFIX,ws.bc.game,香港手动选择",
  "DOMAIN-SUFFIX,wss.bc.game,香港手动选择",
  "DOMAIN-SUFFIX,payment.bc.game,香港手动选择",
  "DOMAIN-KEYWORD,deposit.bc.game,香港手动选择",
  "DOMAIN-KEYWORD,withdraw.bc.game,香港手动选择",
  "DOMAIN-KEYWORD,bc.game,香港手动选择",
  "DOMAIN-KEYWORD,bc.fun,香港手动选择",
  "PROCESS-NAME,prl_naptd,漏网之鱼",
  "RULE-SET,Lan,直连,no-resolve",
  "RULE-SET,DNSLeak,手动选择",
  "RULE-SET,Microsoft,Microsoft",
  "RULE-SET,Bybit,Bybit",
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
  "GEOIP,CN,直连,no-resolve",
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
  var policyGroups = ["手动选择", "GLOBAL", "Apple", "AppStore", "BiliBili", "Bybit",
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

  // 7. 开启嗅探，尽量恢复域名供 China 规则使用
  config.sniffer = config.sniffer || {};
  config.sniffer.enable = true;
  config.sniffer['force-dns-mapping'] = true;
  config.sniffer['parse-pure-ip'] = true;
  if (typeof config.sniffer['override-destination'] === 'undefined') {
    config.sniffer['override-destination'] = false;
  }
  config.sniffer.sniff = config.sniffer.sniff || {};
  config.sniffer.sniff.TLS = config.sniffer.sniff.TLS || { ports: [443, 8443] };
  config.sniffer.sniff.HTTP = config.sniffer.sniff.HTTP || { ports: [80, '8080-8880'], 'override-destination': true };
  config.sniffer.sniff.QUIC = config.sniffer.sniff.QUIC || { ports: [443, 8443] };
  config.sniffer['force-domain'] = config.sniffer['force-domain'] || [];
  config.sniffer['skip-domain'] = config.sniffer['skip-domain'] || ['+.oray.com', 'Mijia Cloud', '+.push.apple.com'];

  // 8. 补全 rule-providers
  var currentProviders = config['rule-providers'] || {};
  Object.keys(defaultRuleProviders).forEach(function(key) {
    if (!currentProviders[key]) {
      currentProviders[key] = defaultRuleProviders[key];
    }
  });
  config['rule-providers'] = currentProviders;

  // 9. 补全路由规则
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
