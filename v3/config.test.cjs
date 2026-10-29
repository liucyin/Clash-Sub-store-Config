const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scripts = [
  'chain-proxy-config.js',
  'chain-proxy-config.local.js',
  'flclash-chain-proxy-override.js'
];
const manifest = 'manifest.opensteamtool.com';
const clone = value => JSON.parse(JSON.stringify(value));
const quiet = { log() {}, warn() {}, error() {} };
const node = (name = 'HK-node') => ({
  name, type: 'socks5', server: '127.0.0.1', port: 17891
});

function load(file) {
  const context = vm.createContext({ console: quiet });
  new vm.Script(fs.readFileSync(path.join(__dirname, file), 'utf8'), {
    filename: file
  }).runInContext(context);
  return input => clone(context.main(clone(input)));
}

// Evaluate the ordinary domain rules used by these scenarios. Remote deny sets
// are not loaded here; native Mihomo validation/runtime is documented separately.
function route(rules, domain) {
  for (const rule of rules) {
    const [type, value, policy] = rule.split(',');
    if (type === 'MATCH' || type === 'FINAL') return value;
    if (type === 'DOMAIN' && domain === value) return policy;
    if (type === 'DOMAIN-SUFFIX' && (domain === value || domain.endsWith('.' + value))) {
      return policy;
    }
  }
}


for (const file of scripts) {
  test(`${file}: manifest exception is exact and custom rule precedence survives early MATCH`, () => {
    const generate = load(file);
    const output = generate({
      proxies: [node()],
      rules: [
        'DOMAIN,blocked.example,REJECT',
        'DOMAIN-SUFFIX,opensteamtool.com,Steam',
        'DOMAIN,allow.example,DIRECT',
        'DOMAIN-SUFFIX,example,REJECT',
        'MATCH,DIRECT',
        'DOMAIN,late.invalid,REJECT',
        'FINAL,REJECT'
      ]
    });
    assert.equal(route(output.rules, manifest), 'DIRECT');
    assert.equal(route(output.rules, 'other.opensteamtool.com'), 'Steam');
    assert.equal(route(output.rules, 'blocked.example'), 'REJECT');
    assert.equal(route(output.rules, 'allow.example'), 'DIRECT');
    assert.equal(route(output.rules, 'late.invalid'), 'REJECT');
    assert.equal(route(output.rules, 'unmatched.invalid'), 'DIRECT');
    assert.equal(output.rules.filter(rule => /^(MATCH|FINAL),/.test(rule)).length, 1);
    assert.equal(output.rules.at(-1), 'MATCH,DIRECT');
    assert.ok(output.rules.indexOf('RULE-SET,Hijacking,REJECT') <
      output.rules.indexOf(`DOMAIN,${manifest},DIRECT`));
  });

  test(`${file}: provider-only and regenerated subscriptions keep resolver policies reachable`, () => {
    const generate = load(file);
    for (const input of [
      {},
      { 'proxy-providers': { Only: { type: 'inline', payload: [node('provider-node')] } } },
      { proxies: [node()], 'proxy-groups': [{ name: 'DNS', type: 'select', proxies: ['DIRECT'] }] }
    ]) {
      const first = generate(input);
      const output = generate(first);
      const known = new Set(['DIRECT', 'REJECT', ...(output.proxies || []).map(proxy => proxy.name),
        ...output['proxy-groups'].map(group => group.name)]);
      const resolvers = [
        ...output.dns.nameserver,
        ...output.dns['proxy-server-nameserver'],
        ...output.dns['direct-nameserver'],
        ...Object.values(output.dns['nameserver-policy']).flat()
      ];
      for (const resolver of resolvers) {
        const policy = decodeURIComponent(new URL(resolver).hash.slice(1));
        if (policy) assert.ok(known.has(policy), `Unresolved DNS policy: ${policy}`);
      }
      assert.equal(output['proxy-groups'].some(group => group.name === 'DNS'), false);
    }
  });

  test(`${file}: final and service DNS policies survive hostile inheritance without changing manifest`, () => {
    const generate = load(file);
    const output = generate({
      proxies: [node(), { name: 'bypass', type: 'direct' }],
      tun: { 'dns-hijack': [], 'auto-route': false, 'route-exclude-address': ['0.0.0.0/0'] },
      dns: {
        'prefer-h3': true,
        fallback: ['8.8.8.8'],
        'proxy-server-nameserver-policy': { '+.example.org': 'system://' },
        'nameserver-policy': { '+.example.org': ['system://'] }
      }
    });
    assert.equal(output.dns.fallback, undefined);
    assert.equal(output.dns['proxy-server-nameserver-policy'], undefined);
    assert.equal(output.dns['nameserver-policy']['+.example.org'], undefined);
    for (const resolver of output.dns.nameserver) {
      assert.equal(new URL(resolver).protocol, 'https:');
      assert.equal(decodeURIComponent(new URL(resolver).hash), '#漏网之鱼');
    }
    const servicePolicies = {
      'rule-set:OpenAI': 'OpenAI',
      'rule-set:Claude': 'Claude',
      'rule-set:Facebook': 'Facebook',
      'rule-set:Gemini': 'Gemini',
      'geosite:ookla-speedtest': 'Speedtest',
      'rule-set:Speedtest': 'Speedtest',
      '+.oca.nflxvideo.net': 'Speedtest',
      'rule-set:Bybit': 'Bybit',
      '+.bybit.eu': 'bybit.eu',
      '+.plasma-one.tech,+.plasma.org,+.plasma.to,+.plasmascan.to': 'Plasma One',
      'rule-set:UK-Wifi-Calling': 'UK-Wifi-Calling',
      'rule-set:kraken': 'Kraken',
      'rule-set:wise': 'Wise',
      'rule-set:okx': 'OKX',
      'rule-set:paypal': 'PayPal',
      'rule-set:binance': 'Binance',
      'rule-set:monzo': 'Monzo',
      'rule-set:revolut': 'Revolut',
      '+.grok.com,+.x.ai': 'Grok'
    };
    if (file !== 'flclash-chain-proxy-override.js') servicePolicies['+.ether.fi'] = 'ether-fi';
    for (const [match, policy] of Object.entries(servicePolicies)) {
      const servers = output.dns['nameserver-policy'][match];
      assert.ok(servers, `Missing service DNS policy: ${match}`);
      assert.deepEqual([...new Set(servers.map(server =>
        decodeURIComponent(new URL(server).hash.slice(1))))], [policy]);
    }
    assert.ok(output.dns['fake-ip-filter'].includes(manifest));
    assert.deepEqual(output.dns['nameserver-policy'][manifest], [
      'https://223.5.5.5/dns-query#DIRECT',
      'https://223.6.6.6/dns-query#DIRECT'
    ]);
    assert.equal(route(output.rules, manifest), 'DIRECT');
    assert.ok(output.tun['dns-hijack'].includes('any:53'));
    assert.ok(output.tun['dns-hijack'].includes('tcp://any:53'));
    assert.ok(!(output.tun['route-exclude-address'] || []).includes('0.0.0.0/0'));
    assert.equal(output.tun['auto-route'], true);
    assert.equal(output.tun['strict-route'], true);
    assert.equal(output.dns['prefer-h3'], false);
    assert.equal(output.ipv6, false);
  });

  test(`${file}: repeated generation does not duplicate routes or chain nodes`, () => {
    const generate = load(file);
    const input = { proxies: [node('Home-US'), node()] };
    const first = generate(input);
    const firstRules = clone(first.rules);
    const second = generate(first);
    assert.deepEqual(second.rules, firstRules);
    assert.equal(second.proxies.length, first.proxies.length);
    assert.equal(new Set(second.proxies.map(proxy => proxy.name)).size, second.proxies.length);
    assert.equal(new Set(second['proxy-groups'].map(group => group.name)).size,
      second['proxy-groups'].length);
    first['rule-providers'].Apple.url = 'https://invalid.example/changed.yaml';
    first.rules.push('DOMAIN,stale.invalid,REJECT');
    const next = generate({ proxies: [node('fresh-node')] });
    assert.ok(!(next.proxies || []).some(proxy => proxy.name.includes('Home-US')));
    assert.notEqual(next['rule-providers'].Apple.url, 'https://invalid.example/changed.yaml');
    assert.equal(next.rules.includes('DOMAIN,stale.invalid,REJECT'), false);
  });
}

test('local listeners preserve 7911–7913 and provider-only relay membership', () => {
  const generate = load('chain-proxy-config.local.js');
  const output = generate({
    'proxy-providers': { Only: { type: 'inline', payload: [node()] } }
  });
  assert.deepEqual(output.listeners.map(listener => listener.port), [7911, 7912, 7913]);
  for (const listener of output.listeners) {
    assert.equal(listener.listen, '127.0.0.1');
    const group = output['proxy-groups'].find(item => item.name === listener.proxy);
    assert.ok(group.use.includes('Only'));
  }
  const empty = generate({});
  for (const listener of empty.listeners) {
    const group = empty['proxy-groups'].find(item => item.name === listener.proxy);
    assert.deepEqual(group.proxies, ['REJECT']);
  }
});
