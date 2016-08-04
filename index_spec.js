var proxy = require('./index');
var http = require('http');

describe('showSystemSettingUi(callback)', function() {
	// it('show', function(done) {
	// 	proxy.showSystemSettingUi(function() {
	// 		done();
	// 	});
	// });
});

describe('getProxySettings(callback)', function() {
	it('print', function(done) {
		proxy.getProxySettings(function(err, ans, warning) {
			expect(err).toBeFalsy();
			expect(typeof ans.proxyEnabled).toBe('boolean');
			expect(ans.proxyServer === null || typeof ans.proxyServer === 'string').toBe(true);
			expect(typeof warning.length).toBe('number');
			console.log(ans);
			done();
		});
	});
});

describe('integration test', function() {
	var getIp = function(url, cb) {
		http.get(url, function(response) {
			var body = '';
			response.on('data', function(d) {
				body += d;
			});
			response.on('end', function() {
				cb(null, body);
			});
		});
	};
	it('real world test', function() {
		getIp('http://api.ipify.org', function(err, ip) {
			console.log('wo proxy', ip);
		});
		// getIp({
		// 	hostname: '153.126.163.109',
		// 	port: 60088,
		// 	path: 'http://api.ipify.org',
		// 	headers: {
		// 		Host: 'api.ipify.org'
		// 	}
		// }, function(err, ip) {
		// 	console.log('w proxy', ip);
		// });
	});
});

describe('urlToConnection(url)', function() {
	var url = 'http://www.google.com';
	var test = function(proxyEnabled, proxyServer) {
		proxy.proxyEnabled = proxyEnabled;
		proxy.proxyServer = proxyServer;
		return proxy.urlToConnection(url);
	};
	it('should do nothing if the proxy is not enabled', function() {
		expect(test(false, '')).toBe(url);
		expect(test(false, '192.168.1.1:8080')).toBe(url);
	});
	it('should parse proxy url correctly', function() {
		var temp = test(true, '192.168.1.1:8080');
		expect(temp.hostname).toBe('192.168.1.1');
		expect(temp.port).toBe(8080);
		expect(temp.path).toBe(url);
		expect(temp.headers.Host).toBe('www.google.com');

		temp = test(true, 'proxy.trueinternet.co.th:80');
		expect(temp.hostname).toBe('proxy.trueinternet.co.th');
		expect(temp.port).toBe(80);

		temp = test(true, 'http://proxy.trueinternet.co.th:80');
		expect(temp.hostname).toBe('proxy.trueinternet.co.th');
		expect(temp.port).toBe(80);

		temp = test(true, 'https://proxy.trueinternet.co.th:80');
		expect(temp.hostname).toBe('proxy.trueinternet.co.th');
		expect(temp.port).toBe(80);

		temp = test(true, 'https://proxy.trueinternet.co.th:80?123');
		expect(temp.hostname).toBe('proxy.trueinternet.co.th');
		expect(temp.port).toBe(80);

		temp = test(true, 'https://proxy.trueinternet.co.th:80#124');
		expect(temp.hostname).toBe('proxy.trueinternet.co.th');
		expect(temp.port).toBe(80);

		temp = test(true, 'https://proxy.trueinternet.co.th:80/123');
		expect(temp.hostname).toBe('proxy.trueinternet.co.th');
		expect(temp.port).toBe(80);

		//hostname must be [a-z0-9\-]
		// https://en.wikipedia.org/wiki/Hostname#Restrictions%5Fon%5Fvalid%5Fhost%5Fnames
		temp = test(true, '%e0%b8%a0%e0%b8%b2%e0%b8%a9%e0%b8%b2%e0%b9%84%e0%b8%97%e0%b8%a2.com:8080');
		expect(temp).toBe(url);

		temp = test(true, 'proxy.trueinternet.co.th');
		expect(temp).toBe(url);

		temp = test(true, '1992.168.1.1:8080');
		expect(temp.hostname).toBe('1992.168.1.1');
		expect(temp.port).toBe(8080);
	});
});
