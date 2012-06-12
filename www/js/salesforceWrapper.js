
function SalesforceWrapper() {
    /* AUTHENTICATION PARAMETERS */
    this.loginUrl = 'https://login.salesforce.com/';
    this.clientId = 'YOUR_KEY_HERE';
    this.redirectUri = 'https://login.salesforce.com/services/oauth2/success';
    
    /* CLASS VARIABLES */
    this.cb = undefined;     //ChildBrowser in PhoneGap
    this.client = undefined; //forceTk client instance
    
    this.init();
}

SalesforceWrapper.prototype.init = function() {
    this.client = new forcetk.Client(this.clientId, this.loginUrl);
    this.cb = window.plugins.childBrowser;
}

SalesforceWrapper.prototype.login = function (successCallback) {
    this.loginSuccess = successCallback;
    var self = this;
    self.cb.onLocationChange = function (loc) {
        if (loc.search(self.redirectUri) >= 0) {
            self.cb.close();
            self.sessionCallback(unescape(loc));
        }
    };
    self.cb.showWebPage(self.getAuthorizeUrl(self.loginUrl, self.clientId, self.redirectUri));
}

SalesforceWrapper.prototype.getAuthorizeUrl = function (loginUrl, clientId, redirectUri) {
    return loginUrl + 'services/oauth2/authorize?display=touch' + '&response_type=token&client_id=' + escape(clientId) + '&redirect_uri=' + escape(redirectUri);
}

SalesforceWrapper.prototype.sessionCallback = function(loc) {    var oauthResponse = {};
    
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
    } else {
        this.client.setSessionToken(oauthResponse.access_token, null, oauthResponse.instance_url);
        if ( this.loginSuccess ) {
            this.loginSuccess();
        }
    }
    this.loginSuccess = undefined;
}
