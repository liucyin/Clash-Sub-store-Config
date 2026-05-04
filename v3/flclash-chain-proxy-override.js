// FlClash 链式代理覆写脚本
// 功能：基于 chain-proxy-config.js 覆写，补全所有代理组并确保它们在 FlClash 中正常显示
// 问题：chain-proxy-config.js 会优先使用订阅自带的代理组，导致 baseConfig 中的丰富分组
//       （如 Gemini、Google、Claude 等）丢失，FlClash 只显示链式中转和链式代理
// 修复：使用 include-all 直接引入节点，不引用可能不存在的地名分组，避免报错
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
// 策略组定义（使用 include-all 直接引入节点，不引用其他代理组）
// include-all 意味着该组直接包含所有订阅节点，不会引用不存在的地名分组
// ========================================

const allGroupDefinitions = [
  {
    name: "手动选择",
    type: "select",
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "自动选择",
    type: "url-test",
    interval: 6, tolerance: 20, lazy: true,
    url: "http://www.google.com/blank.html",
    "disable-udp": false, timeout: 2000, "max-failed-times": 3,
    hidden: true,
    "include-all": true,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png"
  },
  {
    name: "GLOBAL", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Apple", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "AppStore", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/App_Store.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "BiliBili", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/bilibili_4.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Claude", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/wanswu/my-backup@main/IconSet/AI/Claude.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Cursor", type: "select", "disable-udp": false,
    icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/cursor.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Disney", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Disney.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Emby", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Emby.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Gemini", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/guaishouxiaoqi/icons@master/Color/Gemini.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Grok", type: "select", "disable-udp": false,
    icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/grok.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Perplexity", type: "select", "disable-udp": false,
    icon: "https://cdn.jsdelivr.net/gh/liucyin/Clash-Sub-store-Config@main/icon/perplexity.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Github", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/GitHub.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Google", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Microsoft", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Netflix", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "OpenAI", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "OneDrive", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/OneDrive.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Steam", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Steam.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Spotify", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "TikTok", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Telegram", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "Twitter", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Twitter.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "YouTube", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/YouTube.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "漏网之鱼", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Final.png",
    "include-all": true,
    proxies: ["DIRECT", "REJECT"]
  },
  {
    name: "直连", type: "select", "disable-udp": false,
    icon: "https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png",
    proxies: ["DIRECT", "REJECT"]
  }
];

// ========================================
// 脚本主函数
// ========================================

function main(config) {
  console.log("🚀 FlClash 链式代理覆写开始...");

  // 1. 获取现有代理组
  var proxyGroups = config['proxy-groups'] || [];
  console.log("📋 当前代理组数: " + proxyGroups.length);

  var existingNames = proxyGroups.map(function(g) { return g.name; });

  // 2. 检查是否已有链式代理组
  var hasChainGroup = existingNames.indexOf(chainProxyGroupName) !== -1;
  var hasDialerGroup = existingNames.indexOf(dialerProxyGroupName) !== -1;

  // 3. 如果没有链式代理组，创建它们
  if (!hasChainGroup || !hasDialerGroup) {
    var proxies = config.proxies || [];
    console.log("📡 总节点数: " + proxies.length);

    // 识别家宽节点
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
      console.log("🏠 识别到 " + homeProxies.length + " 个家宽节点");

      // 创建链式落地节点
      var chainHomeProxies = homeProxies.map(function(proxy) {
        var clonedProxy = JSON.parse(JSON.stringify(proxy));
        clonedProxy.name = '🔗 ' + proxy.name;
        clonedProxy['dialer-proxy'] = dialerProxyGroupName;
        return clonedProxy;
      });

      // 添加链式落地节点（避免重复）
      var proxyNames = proxies.map(function(p) { return p.name; });
      chainHomeProxies.forEach(function(p) {
        if (proxyNames.indexOf(p.name) === -1) {
          proxies.push(p);
        }
      });
      config.proxies = proxies;

      // 创建链式代理组
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
          proxies: chainHomeProxies.map(function(p) { return p.name; })
        });
      }
      console.log("✅ 已创建链式代理组");
    } else {
      console.warn("⚠️ 未找到家宽节点");
    }
  }

  // 4. 补全缺失的代理组（使用 include-all 不引用其他组，避免 missing 错误）
  existingNames = proxyGroups.map(function(g) { return g.name; });

  allGroupDefinitions.forEach(function(def) {
    if (existingNames.indexOf(def.name) === -1) {
      var newGroup = JSON.parse(JSON.stringify(def));

      // 排除链式节点（🔗 前缀）
      if (newGroup['include-all']) {
        newGroup['exclude-filter'] = '🔗';
      }

      // 自动选择 hidden，其余可见
      newGroup.hidden = (newGroup.name === "自动选择");

      proxyGroups.push(newGroup);
    }
  });

  // 5. 将所有策略组的 proxies 最前面加上链式代理选项
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

  // 6. 确保链式代理组在最前且可见
  proxyGroups.forEach(function(g) {
    if (g.name === dialerProxyGroupName || g.name === chainProxyGroupName) {
      g.hidden = false;
    }
  });

  config['proxy-groups'] = proxyGroups;

  console.log("🎉 FlClash 链式代理覆写完成！代理组总数: " + proxyGroups.length);

  return config;
}
