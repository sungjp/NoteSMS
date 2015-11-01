var $loginBtn = $('#loginBtn');

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
})
