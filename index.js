var parse = require('url').parse;
var exec = require('child_process').exec;
var Registry = require('winreg');


var noop = function() {};
var regKey = new Registry({
	hive: Registry.HKCU,
	key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
});
exports.proxyEnabled = false;
exports.proxyServer = null;


if (process.platform !== 'win32')
	throw new Error('Only Windows is supported: ', process.platform);


exports.showSystemSettingUi = function(callback) {
	callback = callback || noop;
	exec('inetcpl.cpl ,4', function(err) {
		callback(err);
	});
};


exports.getProxySettings = function(callback) {
	callback = callback || noop;
	var ans = {
		proxyEnabled: false,
		proxyServer: null
	};
	var warning = [];
	regKey.values(function(err, items) {
		if (err) return callback(err);
		for (var i = 0; i < items.length; i++) {
			var name = items[i].name;
			var value = items[i].value;

			if (name === 'ProxyEnable') {
				if (value !== '0x0' && value !== '0x1')
					return callback(new Error('Incorrect ProxyEnable Registry: ' + value));
				ans.proxyEnabled = !!parseInt(value);
			}

			if (name === 'ProxyServer')
				ans.proxyServer = value;

			//<local> or semicolon separated string
			if (name === 'ProxyOverride' && value && value !== '<local>')
				warning.push('Warning! Unusual ProxyOverride detected: ' + value);

			//check unusual values
			//0x0 means never run IE, 0x1 means run IE at least once
			if (name === 'MigrateProxy' && value !== '0x1')
				warning.push('Unusual proxy settings: ' + name + ' ' + value);
			if (name === 'ProxyHttp1.1' && value !== '0x1')
				warning.push('Unusual proxy settings: ' + name + ' ' + value);
			if (name === 'EnableHttp1_1' && value !== '0x1')
				warning.push('Unusual proxy settings: ' + name + ' ' + value);
		}
		callback(null, ans, warning);
	});
};


exports.urlToConnection = function(url) {
	if (!exports.proxyEnabled || !exports.proxyServer)
		return url;
	var proxyUrl = parse(exports.proxyServer);
	var destination = parse(url);
	if (!proxyUrl.hostname)
		proxyUrl = parse('http://' + exports.proxyServer);
	if (!destination.host)
		throw new Error();
	return {
		hostname: proxyUrl.hostname,
		port: parseInt(proxyUrl.port || '8080'),
		path: url,
		headers: {
			Host: destination.host
		}
	};
};


//set proxy variables
exports.getProxySettings(function(err, ans, warning) {
	if (err) return console.log('Warning proxy registry reading fails: ', err);
	exports.proxyEnabled = ans.proxyEnabled;
	exports.proxyServer = ans.proxyServer;
});
