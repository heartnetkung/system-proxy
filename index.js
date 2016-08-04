var parse = require('url').parse;
var exec = require('child_process').exec;
var Registry = require('winreg');


var noop = function() {};
exports.proxyEnabled = false;
exports.proxyServer = null;


exports.showSystemSettingUi = function(callback) {
	callback = callback || noop;
	if (process.platform !== 'win32')
		return callback(new Error('Only Windows is supported: ', process.platform));
	exec('inetcpl.cpl ,4', function(err) {
		//the command is always error since it's a GUI application
		callback();
	});
};


exports.getProxySettings = function(callback) {
	callback = callback || noop;
	if (process.platform !== 'win32')
		return callback(new Error('Only Windows is supported: ', process.platform));
	var ans = {
		proxyEnabled: false,
		proxyServer: null
	};
	var warning = [];
	var regKey = new Registry({
		hive: Registry.HKCU,
		key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
	});
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
	var proxyUrl = parse('http://' + exports.proxyServer.replace(/^[^:]+:\/\//, ''));
	if (!proxyUrl.hostname || !proxyUrl.port)
		return url;
	var destination = parse(url);
	return {
		hostname: proxyUrl.hostname,
		port: parseInt(proxyUrl.port),
		path: url,
		headers: {
			Host: destination.host
		}
	};
};


//initially setting proxy from system
exports.init = function(callback) {
	callback = callback || noop;
	exports.getProxySettings(function(err, ans, warning) {
		if (err) return callback(new Error('Warning proxy registry reading fails: ' + (err && err.message)));
		exports.proxyEnabled = ans.proxyEnabled;
		exports.proxyServer = ans.proxyServer;
		callback();
	});
};
