function SalesforceWrapper()
{
    /* AUTHENTICATION PARAMETERS */
    this.loginUrl = 'https://login.salesforce.com/';
    this.clientId = 'YOUR_KEY_HERE';
    this.redirectUri = 'https://login.salesforce.com/services/oauth2/success';

    /* CLASS VARIABLES */
    this.cb = undefined;      // InAppBrowser
    this.client = undefined;  // forceTk client instance

    this.init();
}

SalesforceWrapper.prototype.init = function() {
    this.client = new forcetk.Client(this.clientId, this.loginUrl);
};

SalesforceWrapper.prototype.login = function (successCallback) {
    var url = this.getAuthorizeURL(this.loginUrl, this.clientId, this.redirectUri);
    this.cb = window.open(url, "_blank", 'location=no,toolbar=no,clearsessioncache=yes');
    this.loginSuccess = successCallback;

    var self = this;
    self.cb.addEventListener('loadstop', function(e) {
	    var loc = e.url;
	    if (loc.indexOf(self.redirectUri) != -1){
		self.cb.close();
		self.sessionCallback(unescape(loc));
	    }
	});
};

SalesforceWrapper.prototype.getAuthorizeURL = function (loginUrl, clientId, redirectUri) {
       return loginUrl + 'services/oauth2/authorize?' + '&response_type=token&client_id=' + encodeURIComponent(clientId) + '&redirect_uri=' + encodeURIComponent(redirectUri);
};

SalesforceWrapper.prototype.sessionCallback = function (loc) {
    var oauthResponse = {};
    var fragment = loc.split("#")[1];

    if (fragment) {
	var nvps = fragment.split('&');
	for (var nvp in nvps) {
	    var parts = nvps[nvp].split('=');
	    oauthResponse[parts[0]] = unescape(parts[1]);
	}
    }

    if (typeof oauthResponse === 'undefined' || typeof oauthResponse['access_token'] === 'undefined') {
	console.log("error");
    }
    else {
	this.client.setSessionToken(oauthResponse.access_token, null, oauthResponse.instance_url);
	if (this.loginSuccess){
	    this.loginSuccess();
	}
    }
    this.loginSuccess = undefined;
};
