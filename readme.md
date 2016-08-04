## system-proxy
Supports only Windows for now

#### api.showSystemSettingUi(function(err){})
- system dependent

#### api.getProxySettings(function(err, proxy, warning){})
- return {proxyEnabled: boolean, proxyServer: null|string}
- warning is an array of string which warns about weird settings
- system dependent

#### api.urlToConnection(url)
- system independent

#### api.init(function(err){})
- retrieve settings from the system and set it properly
- system independent

#### api.proxyEnable=boolean
- override what retrieved from the system

#### api.proxyServer=string
- override what retrieved from the system