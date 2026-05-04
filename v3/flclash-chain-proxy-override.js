// FlClash 链式代理覆写脚本
// 功能：基于 chain-proxy-config.js 覆写，在 FlClash 中添加链式代理功能
// 使用：在 FlClash 中通过 Sub-Store 脚本覆写使用此脚本，先应用 chain-proxy-config.js 再用此脚本修正显示
// 效果：链式中转和链式代理正常显示，其他代理组也正常显示（修正 chain-proxy-config.js 中的 hidden 问题）

// ========================================
// 配置区域（需要根据实际情况修改）
// ========================================

// 家宽节点识别关键词（用于从订阅中筛选家宽节点）
// 支持正则表达式，多个关键词用 | 分歧
const homeProxyFilter = "家宽|Home|住宅|Residential|IPLC|Hd|SC|DMIT|CORONA";

// 链式代理组名称（必须与 chain-proxy-config.js 保持一致）
const chainProxyGroupName = "🏠 链式代理";

// 链式代理中转节点选择组名称（必须与 chain-proxy-config.js 保持一致）
const dialerProxyGroupName = "🔗 链式中转";

// ========================================
// 脚本主函数
// ========================================

function main(config) {
  console.log("🚀 FlClash 链式代理覆写开始...");

  // 1. 修正所有代理组的 hidden 属性，确保都能在 FlClash 中显示
  // chain-proxy-config.js 可能导致只有链式中转和链式代理可见，其他组无法显示
  const proxyGroups = config['proxy-groups'] || [];
  proxyGroups.forEach(group => {
    group.hidden = false;
  });
  console.log(`✅ 已修正 ${proxyGroups.length} 个代理组的显示状态，所有组均可正常显示`);

  // 2. 获取所有节点
  const proxies = config.proxies || [];
  console.log(`📡 总节点数: ${proxies.length}`);

  // 3. 检查是否已存在链式代理组（chain-proxy-config.js 可能已创建）
  const hasChainGroup = proxyGroups.some(g => g.name === chainProxyGroupName);
  const hasDialerGroup = proxyGroups.some(g => g.name === dialerProxyGroupName);

  if (hasChainGroup && hasDialerGroup) {
    console.log("✅ 链式代理组已存在，无需重复创建");
  } else {
    // 如果链式代理组不存在，手动创建
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

      // 添加链式落地节点到 proxies
      // 先检查是否已存在，避免重复
      const existingNames = proxies.map(p => p.name);
      const newChainProxies = chainHomeProxies.filter(p => !existingNames.includes(p.name));
      if (newChainProxies.length > 0) {
        proxies.push(...newChainProxies);
        console.log(`✅ 已创建 ${newChainProxies.length} 个链式落地节点`);
      }

      config.proxies = proxies;

      // 创建链式中转节点选择组
      const dialerGroup = {
        name: dialerProxyGroupName,
        type: 'select',
        hidden: false,
        icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png',
        'include-all': true,
        'exclude-filter': '🔗|DIRECT|REJECT'
      };

      // 创建链式代理组
      const chainGroup = {
        name: chainProxyGroupName,
        type: 'select',
        hidden: false,
        icon: 'https://testingcf.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png',
        proxies: chainHomeProxies.map(p => p.name)
      };

      // 添加到代理组列表最前面
      proxyGroups.unshift(chainGroup);
      proxyGroups.unshift(dialerGroup);

      console.log("✅ 已创建链式代理组:");
      console.log(`   - ${dialerProxyGroupName} (中转节点选择)`);
      console.log(`   - ${chainProxyGroupName} (链式家宽落地选择)`);
    } else {
      console.warn("⚠️ 未找到家宽节点，跳过链式代理组创建");
    }
  }

  // 4. 为非链式代理组添加排除规则，排除克隆的链式节点
  proxyGroups.forEach(group => {
    if (group.name === chainProxyGroupName || group.name === dialerProxyGroupName) {
      return;
    }

    if (group['include-all']) {
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

  console.log("🎉 FlClash 链式代理覆写完成！");
  console.log("\nFlClash 使用说明：");
  console.log("1. 所有代理组在 FlClash 中均可正常显示");
  console.log(`2. 在 ${dialerProxyGroupName} 中选择机场中转节点`);
  console.log(`3. 在 ${chainProxyGroupName} 中选择家宽落地节点`);
  console.log("4. 其他代理组（手动选择、Claude、OpenAI 等）也正常显示和切换\n");

  return config;
}