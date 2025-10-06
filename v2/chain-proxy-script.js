// Mihomo 链式代理扩展脚本
// 适用于：订阅中已包含家宽节点的情况
// 功能：普通流量走机场，AI 服务走【机场中转 → 家宽落地】

// ========================================
// 配置区域（需要根据实际情况修改）
// ========================================

// 家宽节点识别关键词（用于从订阅中筛选家宽节点）
// 支持正则表达式，多个关键词用 | 分隔
const homeProxyFilter = "家宽|Home|住宅|Residential|IPLC|Hd";

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
// 脚本主函数（一般不需要修改）
// ========================================

function main(config, profileName) {
  console.log("🚀 开始处理链式代理配置...");
  
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
  
  // 创建链式中转节点选择组（从机场节点中选择，排除所有家宽节点）
  const dialerGroup = {
    name: dialerProxyGroupName,
    type: 'select',
    icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png',
    'include-all': true,
    'exclude-filter': homeProxyFilter + '|🔗|DIRECT|REJECT'
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
  console.log(`   - ${dialerProxyGroupName} (中转节点选择，排除家宽)`);
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
  const aiGroups = ['Claude', 'OpenAI', 'Gemini', 'Google', 'Perplexity', 'TikTok'];
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
  
  // 8. 添加 AI 规则集
  const ruleProviders = config['rule-providers'] || {};
  Object.assign(ruleProviders, aiRuleProviders);
  config['rule-providers'] = ruleProviders;
  console.log("✅ 已添加 AI 规则集");
  
  // 9. 添加链式代理规则（优先级最高）
  const rules = config.rules || [];
  config.rules = [...chainProxyRules, ...rules];
  console.log(`✅ 已添加 ${chainProxyRules.length} 条链式代理规则`);
  
  console.log("🎉 链式代理配置完成！");
  console.log("\n使用说明：");
  console.log(`1. 在 ${dialerProxyGroupName} 中选择机场中转节点`);
  console.log(`2. 在 ${chainProxyGroupName} 中选择家宽落地节点`);
  console.log("3. AI 服务自动走链式代理（机场→家宽）");
  console.log("4. 其他流量走普通机场节点\n");
  
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

