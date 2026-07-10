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
  { name: "自动选择", type: "url-test", interval: 60, tolerance: 80, lazy: true, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png" },
  { name: "GLOBAL", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Apple", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "AppStore", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/App_Store.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "BiliBili", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/bilibili_4.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Speedtest", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Speedtest.png", "include-all": true, proxies: ["DIRECT", "手动选择", "自动选择", "香港手动选择", "台湾手动选择", "日本手动选择", "新加坡手动选择", "美国手动选择", "REJECT"] },
  { name: "Bybit", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/bybit.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Wise", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/wise.png", "include-all": true, proxies: ["DIRECT", "美国手动选择", "美国", "英国", "手动选择", "REJECT"] },
  { name: "OKX", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/okx.png", "include-all": true, proxies: ["美国手动选择", "美国", "日本手动选择", "日本", "新加坡手动选择", "新加坡", "香港手动选择", "香港", "台湾手动选择", "台湾", "手动选择", "DIRECT", "REJECT"] },
  { name: "PayPal", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/PayPal.png", "include-all": true, proxies: ["美国手动选择", "美国", "英国手动选择", "英国", "手动选择", "DIRECT", "REJECT"] },
  { name: "Binance", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/binance.png", "include-all": true, proxies: ["日本手动选择", "日本", "新加坡手动选择", "新加坡", "香港手动选择", "香港", "台湾手动选择", "台湾", "手动选择", "DIRECT", "REJECT"] },
  { name: "Monzo", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/monzo.png", "include-all": true, proxies: ["英国手动选择", "英国", "手动选择", "美国手动选择", "美国", "DIRECT", "REJECT"] },
  { name: "Revolut", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/revolut.png", "include-all": true, proxies: ["英国手动选择", "英国", "美国手动选择", "美国", "新加坡手动选择", "新加坡", "手动选择", "DIRECT", "REJECT"] },
  { name: "Claude", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/claude.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Cursor", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/cursor.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Disney", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Disney.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Duolingo", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/duolingo.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Emby", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Emby.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Gemini", type: "select", "disable-udp": false, icon: "https://testingcf.jsdelivr.net/gh/guaishouxiaoqi/icons@master/Color/Gemini.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Grok", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/grok.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
  { name: "Kraken", type: "select", "disable-udp": false, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/kraken.png", "include-all": true, proxies: ["DIRECT", "REJECT"] },
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
  { name: "香港", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png", filter: "🇭🇰|香港|港|HK|hongkong|hong kong" },
  { name: "澳门", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Macao.png", filter: "🇲🇴|澳门|门|MO|macao" },
  { name: "台湾", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png", filter: "🇹🇼|台湾|台|TW|taiwan|taipei" },
  { name: "日本", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png", filter: "🇯🇵|日本|JP|japan|tokyo|osaka" },
  { name: "韩国", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Korea.png", filter: "🇰🇷|韩国|韩|KR|korea|seoul" },
  { name: "美国", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png", filter: "🇺🇸|美国|美|US|united states|america|los angeles|san jose|silicon valley" },
  { name: "英国", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Kingdom.png", filter: "🇬🇧|英国|英|UK|united kingdom|london" },
  { name: "德国", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Germany.png", filter: "🇩🇪|德国|德|DE|germany|frankfurt" },
  { name: "法国", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/France.png", filter: "🇫🇷|法国|法|FR|france|paris" },
  { name: "印度", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/India.png", filter: "🇮🇳|印度|IN|india|mumbai" },
  { name: "新加坡", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png", filter: "🇸🇬|新加坡|新|SG|singapore" },
  { name: "印尼", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/indonesia.png", filter: "🇮🇩|印尼|印度尼西亚|ID|indonesia|jakarta" },
  { name: "越南", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/vietnam.png", filter: "🇻🇳|越南|VN|vietnam" },
  { name: "泰国", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Thailand.png", filter: "🇹🇭|泰国|TH|thailand|bangkok" },
  { name: "澳洲", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Australia.png", filter: "🇦🇺|澳大利亚|AU|australia|sydney" },
  { name: "巴西", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Brazil.png", filter: "🇧🇷|巴西|brazil" },
  { name: "其他", type: "url-test", interval: 30, tolerance: 80, lazy: false, url: "https://www.gstatic.com/generate_204", "disable-udp": false, timeout: 1500, "max-failed-times": 2, hidden: true, "include-all": true, icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png", filter: "(?i)^(?!.*(香港|台湾|日本|韩国|新加坡|美国|英国|德国|法国|印度|泰国|越南|印尼|澳大利亚|巴西|港|台|日|韩|新|美|英|德|法|印|泰|越|尼|澳|巴|hk|tw|jp|kr|sg|us|uk|de|fr|in|th|vn|id|au|br)).*" },
  { name: "香港手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png", "include-all": true, "exclude-filter": "🔗", filter: "🇭🇰|香港|港|HK|hongkong|hong kong", proxies: ["DIRECT", "REJECT"] },
  { name: "台湾手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png", "include-all": true, "exclude-filter": "🔗", filter: "🇹🇼|台湾|台|TW|taiwan|taipei", proxies: ["DIRECT", "REJECT"] },
  { name: "日本手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png", "include-all": true, "exclude-filter": "🔗", filter: "🇯🇵|日本|日|JP|japan|tokyo", proxies: ["DIRECT", "REJECT"] },
  { name: "新加坡手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png", "include-all": true, "exclude-filter": "🔗", filter: "🇸🇬|新加坡|新|SG|singapore", proxies: ["DIRECT", "REJECT"] },
  { name: "美国手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png", "include-all": true, "exclude-filter": "🔗", filter: "🇺🇸|美国|美|US|united states|america", proxies: ["DIRECT", "REJECT"] },
  { name: "英国手动选择", type: "select", icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Kingdom.png", "include-all": true, "exclude-filter": "🔗", filter: "🇬🇧|英国|英|UK|united kingdom|london", proxies: ["DIRECT", "REJECT"] },
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
  Speedtest: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Speedtest/Speedtest.yaml" },
  duolingo: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "漏网之鱼", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/duolingo.yaml" },
  kraken: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "漏网之鱼", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/kraken.yaml" },
  cursor: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "漏网之鱼", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/cursor.yaml" },
  wise: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "漏网之鱼", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/wise.yaml" },
  okx: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "漏网之鱼", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/okx.yaml" },
  paypal: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://cdn.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@latest/VirtualFinance/Paypal.yaml" },
  binance: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "漏网之鱼", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/binance.yaml" },
  monzo: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://cdn.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@latest/VirtualFinance/Monzo.yaml" },
  revolut: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "DIRECT", url: "https://cdn.jsdelivr.net/gh/Accademia/Additional_Rule_For_Clash@latest/VirtualFinance/Revolut.yaml" },
  perplexity: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "漏网之鱼", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/perplexity.yaml" },
  ifast: { type: "http", behavior: "classical", interval: 3600, format: "yaml", proxy: "漏网之鱼", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/ifast.yaml" }
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
  "GEOSITE,ookla-speedtest,Speedtest",
  "RULE-SET,Speedtest,Speedtest",
  "DOMAIN-SUFFIX,oca.nflxvideo.net,Speedtest",
  "RULE-SET,perplexity,Perplexity",
  "RULE-SET,cursor,Cursor",
  "RULE-SET,duolingo,Duolingo",
  "RULE-SET,kraken,Kraken",
  "RULE-SET,wise,Wise",
  "RULE-SET,okx,OKX",
  "RULE-SET,paypal,PayPal",
  "RULE-SET,binance,Binance",
  "RULE-SET,monzo,Monzo",
  "RULE-SET,revolut,Revolut",
  "RULE-SET,ifast,直连",
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
  "PROCESS-NAME,prl_naptd,漏网之鱼",
  "RULE-SET,Lan,直连,no-resolve",
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
  "RULE-SET,Hijacking,REJECT",
  "GEOIP,CN,直连,no-resolve",
  "MATCH,漏网之鱼"
];

// ========================================
// 脚本主函数
// ========================================

function main(config) {
  console.log("🚀 FlClash 链式代理覆写开始...");

  config['allow-lan'] = false;
  config['bind-address'] = '127.0.0.1';

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
    "Claude", "Cursor", "Disney", "Emby", "Gemini", "Grok", "Kraken", "Perplexity",
    "Github", "Google", "Microsoft", "Netflix", "OpenAI", "OneDrive", "Steam",
    "Spotify", "TikTok", "Telegram", "Twitter", "YouTube", "漏网之鱼"];
  var chainGroupAvailable = proxyGroups.some(function(g) { return g.name === chainProxyGroupName; });

  proxyGroups.forEach(function(g) {
    if (chainGroupAvailable && policyGroups.indexOf(g.name) !== -1) {
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

  // 8. 强制 DNS/TUN 防泄露设置
  if (typeof config.ipv6 !== 'undefined') { config.ipv6 = false; }
  config.tun = config.tun || {};
  config.tun.enable = true;
  config.tun['strict-route'] = true;
  config.tun['dns-hijack'] = config.tun['dns-hijack'] || ['any:53', 'tcp://any:53'];
  config.dns = config.dns || {};
  config.dns.enable = true;
  config.dns.listen = '127.0.0.1:1053';
  config.dns.ipv6 = false;
  config.dns['use-hosts'] = true;
  config.dns['use-system-hosts'] = false;
  config.dns['fake-ip-range'] = config.dns['fake-ip-range'] || '198.18.0.1/16';
  config.dns['fake-ip-filter-mode'] = 'blacklist';
  config.dns['fake-ip-filter'] = config.dns['fake-ip-filter'] || [
    '+.lan',
    '+.local',
    '+.msftconnecttest.com',
    '+.msftncsi.com',
    'localhost.ptlogin2.qq.com',
    'localhost.sec.qq.com',
    'localhost.work.weixin.qq.com'
  ];
  config.dns['respect-rules'] = true;
  config.dns['enhanced-mode'] = config.dns['enhanced-mode'] || 'fake-ip';
  config.dns['default-nameserver'] = [
    'tls://223.5.5.5:853',
    'https://223.5.5.5/dns-query'
  ];
  config.dns.nameserver = [
    'https://1.1.1.1/dns-query#漏网之鱼',
    'https://dns.google/dns-query#漏网之鱼'
  ];
  config.dns['proxy-server-nameserver'] = [
    'https://223.5.5.5/dns-query#DIRECT',
    'https://doh.pub/dns-query#DIRECT'
  ];
  config.dns['direct-nameserver'] = [
    'https://doh.pub/dns-query#DIRECT',
    'https://223.5.5.5/dns-query#DIRECT',
    'https://dns.alidns.com/dns-query#DIRECT'
  ];
  config.dns['direct-nameserver-follow-policy'] = true;
  var nameserverPolicy = config.dns['nameserver-policy'] || {};
  nameserverPolicy['geosite:cn'] = [
    'https://223.5.5.5/dns-query#DIRECT',
    'https://doh.pub/dns-query#DIRECT'
  ];
  nameserverPolicy['rule-set:OpenAI'] = [
    'https://1.1.1.1/dns-query#OpenAI',
    'https://dns.google/dns-query#OpenAI'
  ];
  nameserverPolicy['rule-set:Claude'] = [
    'https://1.1.1.1/dns-query#Claude',
    'https://dns.google/dns-query#Claude'
  ];
  nameserverPolicy['rule-set:Gemini'] = [
    'https://1.1.1.1/dns-query#Gemini',
    'https://dns.google/dns-query#Gemini'
  ];
  nameserverPolicy['geosite:ookla-speedtest'] = [
    'https://1.1.1.1/dns-query#Speedtest',
    'https://dns.google/dns-query#Speedtest'
  ];
  nameserverPolicy['rule-set:Speedtest'] = [
    'https://1.1.1.1/dns-query#Speedtest',
    'https://dns.google/dns-query#Speedtest'
  ];
  nameserverPolicy['+.oca.nflxvideo.net'] = [
    'https://1.1.1.1/dns-query#Speedtest',
    'https://dns.google/dns-query#Speedtest'
  ];
  nameserverPolicy['rule-set:Bybit'] = [
    'https://1.1.1.1/dns-query#Bybit',
    'https://dns.google/dns-query#Bybit'
  ];
  nameserverPolicy['rule-set:kraken'] = [
    'https://1.1.1.1/dns-query#Kraken',
    'https://dns.google/dns-query#Kraken'
  ];
  nameserverPolicy['rule-set:wise'] = [
    'https://1.1.1.1/dns-query#Wise',
    'https://dns.google/dns-query#Wise'
  ];
  nameserverPolicy['rule-set:okx'] = [
    'https://1.1.1.1/dns-query#OKX',
    'https://dns.google/dns-query#OKX'
  ];
  nameserverPolicy['rule-set:paypal'] = [
    'https://1.1.1.1/dns-query#PayPal',
    'https://dns.google/dns-query#PayPal'
  ];
  nameserverPolicy['rule-set:binance'] = [
    'https://1.1.1.1/dns-query#Binance',
    'https://dns.google/dns-query#Binance'
  ];
  nameserverPolicy['rule-set:monzo'] = [
    'https://1.1.1.1/dns-query#Monzo',
    'https://dns.google/dns-query#Monzo'
  ];
  nameserverPolicy['rule-set:revolut'] = [
    'https://1.1.1.1/dns-query#Revolut',
    'https://dns.google/dns-query#Revolut'
  ];
  nameserverPolicy['+.grok.com,+.x.ai'] = [
    'https://1.1.1.1/dns-query#Grok',
    'https://dns.google/dns-query#Grok'
  ];
  nameserverPolicy['geosite:private'] = ['system://'];
  config.dns['nameserver-policy'] = nameserverPolicy;

  config.hosts = config.hosts || {};
  var dnsHosts = {
    "dns.alidns.com": ["223.5.5.5", "223.6.6.6"],
    "doh.pub": ["1.12.12.12", "120.53.53.53"],
    "dns.google": ["8.8.8.8", "8.8.4.4"],
    "cloudflare-dns.com": ["1.1.1.1", "1.0.0.1"]
  };
  Object.keys(dnsHosts).forEach(function(host) {
    if (!config.hosts[host]) { config.hosts[host] = dnsHosts[host]; }
  });

  // 9. 补全 rule-providers
  var currentProviders = config['rule-providers'] || {};
  Object.keys(defaultRuleProviders).forEach(function(key) {
    if (!currentProviders[key]) {
      currentProviders[key] = defaultRuleProviders[key];
    }
  });
  Object.keys(currentProviders).forEach(function(key) {
    var provider = currentProviders[key];
    if (provider && typeof provider.url === 'string' && provider.url.indexOf('raw.githubusercontent.com') !== -1) {
      provider.proxy = '漏网之鱼';
    }
  });
  config['rule-providers'] = currentProviders;

  // 10. 补全路由规则
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
