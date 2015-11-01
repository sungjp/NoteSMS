function toQueryString(obj) {
  var str = [];
  for (var p in obj)
  if (obj.hasOwnProperty(p)) {
    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
  }
  return str.join("&");
}

var $loginBtn = $('#loginBtn');
var $submitBtnSect = $('#submitBtnSect');
var $form = $('form');


var oauthAuthorizeUrl = 'https://login.live.com/oauth20_authorize.srf',
    oauthTokenUrl = 'https://login.live.com/oauth20_token.srf';

// FUCK IT SHIP IT
var clientId = '00000000481745E0',
    redirectUrl = 'https://32e9179f.ngrok.io/redirect',
    clientSecret = 'kpEn6K/2O7FCzz2d0DRAwcoChscXGiQt';

var scopes = ['wl.signin', 'wl.basic', 'wl.offline_access', 'office.onenote_create'];
var query = toQueryString({
    'client_id': clientId,
    'scope': scopes.join(' '),
    'redirect_uri': redirectUrl,
    'display': 'page',
    'locale': 'en',
    'response_type': 'code'
});

window.authUrl = oauthAuthorizeUrl + "?" + query;

function openPopUp(url) {
    var width = 525,
        height = 630,
        screenTop = !!window.screenTop ? window.screenTop : window.screenY,
        screenLeft = !!window.screenLeft ? window.screenLeft : window.screenX,
        top = Math.floor(screenTop + ($(window).height() - height) / 2),
        left = Math.floor(screenLeft + ($(window).width() - width) / 2);

    var features = [
        "width=" + width,
        "height=" + height,
        "top=" + top,
        "left=" + left,
        "status=no",
        "resizable=yes",
        "toolbar=no",
        "menubar=no",
        "scrollbars=yes"];

    var popup = window.open(url, "oauth", features.join(","));
    popup.focus();

    return popup;
}

$loginBtn.on('click', function() {
  openPopUp(window.authUrl);  
});

$form.submit(function(){
      $.ajax({
      type: "POST"
      url: '/phoneNumber',
      data: {id: phoneNumber},
      cache: false,
      success: function(data) {
        $submitBtnSect.hide();
        $loginBtn.show();
      }
  });
});
