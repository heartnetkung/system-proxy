var proxy = require('./index');
var logger = function() { console.log(arguments) }

describe('showSystemSettingUi(callback)', function() {
	it('show', function() {
		proxy.showSystemSettingUi(logger);
	});
});

describe('getProxySettings(callback)', function() {
	it('print', function() {
		proxy.getProxySettings(logger);
	});
});

describe('urlToConnection(url)', function() {
	it('should handle all possible combination', function() {
		proxy.urlToConnection(logger);
	});
});

