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

function dnsCandidates(config) {
  const group = config['proxy-groups'].find(item => item.name === 'DNS');
  const providers = Object.values(config['proxy-providers'] || {})
    .flatMap(provider => provider.payload || []);
  const excludedTypes = new Set(group['exclude-type'].split('|').map(type => type.toLowerCase()));
  const excludedNames = new RegExp(group['exclude-filter']);
  const candidates = [...(config.proxies || []), ...providers]
    .filter(proxy => !excludedTypes.has(proxy.type.toLowerCase()) && !excludedNames.test(proxy.name));
  return { group, candidates };
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

  test(`${file}: provider-only subscriptions keep usable DNS nodes, empty ones reject`, () => {
    const generate = load(file);
    const provider = { type: 'inline', payload: [node('provider-node')] };
    const input = {
      'proxy-providers': { Only: provider },
      'proxy-groups': [{ name: 'DNS', type: 'select', proxies: ['DIRECT'] }]
    };
    const output = generate(input);
    assert.deepEqual(output['proxy-providers'].Only.payload, provider.payload);
    const { group, candidates } = dnsCandidates(output);
    assert.deepEqual(candidates.map(proxy => proxy.name), ['provider-node']);
    assert.equal(group.proxies, undefined);
    assert.equal(group['empty-fallback'], 'REJECT');
    const empty = dnsCandidates(generate({}));
    assert.deepEqual(empty.candidates, []);
    assert.equal(empty.group['empty-fallback'], 'REJECT');
  });

  test(`${file}: inherited resolver fallback cannot bypass DNS policy`, () => {
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
      assert.equal(new URL(resolver).hash, '#DNS');
    }
    assert.deepEqual(dnsCandidates(output).candidates.map(proxy => proxy.name), ['HK-node']);
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
