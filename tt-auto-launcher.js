(function () {
    var rawUrl = 'https://cdn.jsdelivr.net/gh/yh0s/tt-auto-js@main/tt-auto.js' + '?t=' + Date.now();
    var s = document.createElement('script');
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        var policyName = 'tt-loader-' + Date.now();
        try {
            var policy = window.trustedTypes.createPolicy(policyName, {
                createScriptURL: function (url) { return url; }
            });
            s.src = policy.createScriptURL(rawUrl);
        } catch (e) { s.src = rawUrl; }
    } else { s.src = rawUrl; }
    document.head.appendChild(s);
})();