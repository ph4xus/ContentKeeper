var timeout, interval, alarmDate, userEmail, thisCKPortIP, thisChromeIP, ckAuthData, email, encryptedEmail, epoch, encryptedEpoch, greenColor = [76, 187, 23, 100],
    yellowColor = [230, 230, 0, 100],
    redColor = [230, 0, 0, 100],
    guiLagAdjustment = 500,
    bGetCKIPSemphor = !1,
    decryptedData = "",
    ckIDHash = "",
    doesGEOLocation = 0,
    platformSupported = 1,
    firstRun = !0,
    requestFilter = {
        urls: ["<all_urls>"]
    },
    manifestData = chrome.runtime.getManifest(),
    version = manifestData.version;
const webAssemblyInputDataLengthErrorMessage = "Input data is NULL",
    webAssemblyInputInvalidErrorMessage = "Input data is invalid";
var getIpInProgress = !1,
    getCKPortIPTimeout = 5e3,
    retryTestWebAssemblyTime = 100,
    moduleInitialized = !1;
LOG("Extension version", version), LOG(manifestData.name), testWebAssemblyReady(), chrome.runtime.getPlatformInfo((function(info) {
    LOG(info)
})), chrome.runtime.onStartup.addListener((function() {
    LOG("pluginStarted"), LOG(chrome.runtime.PlatformOs)
})), getUserEmail(), chrome.identity.onSignInChanged.addListener((function(account, signedIn) {
    getUserEmail()
}));
var callbacks = {},
    finalvalue = "";

function encryptData(data) {
    return Module.ccall("encryptData", "string", ["string"], [data])
}

function decryptData(data) {
    return Module.ccall("decryptData", "string", ["string"], [data])
}
var target = "<all_urls>",
    pendingRequests = [];

function completed(requestDetails) {
    var index = pendingRequests.indexOf(requestDetails.requestId);
    index > -1 && pendingRequests.splice(index, 1)
}

function gotCredentials(requestDetails, callback) {
    if (userEmail && moduleInitialized) {
        new Date;
        const secondsSinceEpoch = Math.round(Date.now() / 1e3);
        var credentials = {},
            data = `${userEmail},${String(secondsSinceEpoch)}`;
        try {
            var messageResult = encryptData(data);
            if (!isWebAssemblyErrorMessage(messageResult)) {
                var messageTokens = messageResult.split(",");
                credentials.username = messageTokens[0], credentials.password = messageTokens[1], callback({
                    authCredentials: credentials
                })
            }
        } catch (exception) {
            console.log("Module not ready. Credentials")
        }
    }
}

function provideCredentialsAsync(requestDetails, callback) {
    -1 != pendingRequests.indexOf(requestDetails.requestId) ? (LOG("bad credentials for: " + requestDetails.requestId), callback({
        cancel: !0
    })) : (pendingRequests.push(requestDetails.requestId), 407 == requestDetails.statusCode ? gotCredentials(requestDetails, callback) : 401 == requestDetails.statusCode && callback({
        cancel: !1
    }))
}

function getGEOLocation() {
    var startPos;
    navigator.geolocation.getCurrentPosition((function(position) {
        startPos = position, document.getElementById("startLat").innerHTML = startPos.coords.latitude, document.getElementById("startLon").innerHTML = startPos.coords.longitude
    }))
}

function onCkDomContentLoaded() {
    LOG("onCkDomContentLoaded started"), chrome.browserAction.setBadgeBackgroundColor({
        color: redColor
    }), chrome.browserAction.setBadgeText({
        text: "off"
    }), ring(), doesGEOLocation = navigator.geolocation ? 1 : 0
}

function setAlarm(tMillis) {
    interval = tMillis, ringIn(tMillis + guiLagAdjustment)
}

function ringIn(tMillis) {
    clearTimeout(timeout), pauseDate = null;
    var tSecs = parseInt(tMillis / 1e3),
        tMins = parseInt(tSecs / 60),
        secs = tSecs % 60,
        tHrs = parseInt(tMins / 60),
        mins = tMins % 60,
        millis = tMillis % 1e3;
    (alarmDate = new Date).setHours(alarmDate.getHours() + tHrs), alarmDate.setMinutes(alarmDate.getMinutes() + mins), alarmDate.setSeconds(alarmDate.getSeconds() + secs), alarmDate.setMilliseconds(alarmDate.getMilliseconds() + millis);
    var setDate = new Date;
    timeout = setTimeout(ring, alarmDate.getTime() - setDate.getTime())
}

function restart() {
    ringIn(interval + guiLagAdjustment)
}

function getTimeLeft() {
    var now = new Date;
    return alarmDate.getTime() - now.getTime()
}

function getTimeLeftPercent() {
    return parseInt(getTimeLeft() / interval * 100)
}

function getTimeLeftString() {
    var until = getTimeLeft(),
        tSecs = parseInt(until / 1e3),
        tMins = parseInt(tSecs / 60),
        secs = tSecs % 60,
        tHrs = parseInt(tMins / 60),
        mins = tMins % 60;
    return secs < 10 && (secs = "0" + secs), mins < 10 && (mins = "0" + mins), tHrs < 10 && (tHrs = "0" + tHrs), (tHrs > 0 ? tHrs + ":" : "") + mins + ":" + secs
}

function didCreateNotification(notificationId) {}

function exchangeData() {
    getIpInProgress || (LOG("-------------------------------"), LOG("thisChromeIP is " + thisChromeIP), LOG("thisCKPortIP is " + thisCKPortIP), LOG("userEmail is " + userEmail), getCKPortIP("192.0.2.1", parsePortIPData), userEmail || getUserEmail(), prepDataForCK())
}

function prepDataForCK() {
    if (thisCKPortIP && userEmail) try {
        var encryptedMessage = encryptData("<st>Chrome</st><v>1</v><uname>" + userEmail + "</uname><iip>" + thisChromeIP + "</iip>");
        if (!isWebAssemblyErrorMessage(encryptedMessage)) {
            var ckAuthData = "<ckauth>" + encryptedMessage + "</ckauth>";
            LOG("send ping to first responder"), sendDataToSYNResp("192.0.2.1", ckAuthData)
        }
    } catch (exception) {
        console.log("Module not ready. Prep data")
    }
}

function sendDataToSYNResp(ip, ckAuthData) {
    var url = "http://" + ip + "/?send_ck_ping=" + ckAuthData;
    url = appendTimeStampToUrl(url), jQuery.ajax({
        type: "GET",
        url: url
    }).done((function(data) {
        LOG(ip)
    })).fail((function(data) {
        LOG(data), "192.0.2.1" == ip && (LOG("send ping to second responder"), sendDataToSYNResp("192.0.2.2", ckAuthData))
    }))
}

function tickleUser(ip) {
    if (ckIDHash.length > 1) {
        var url = "http://" + ip + "/?tickle_user&<h>" + ckIDHash + "</h>";
        url = appendTimeStampToUrl(url), jQuery.ajax({
            type: "GET",
            url: url
        }).done((function(data) {
            LOG(data), data.search("FAILURE") > 0 ? (LOG("tickleUser failed"), ckIDHash = "", chrome.browserAction.setBadgeBackgroundColor({
                color: redColor
            }), chrome.browserAction.setBadgeText({
                text: "off"
            })) : (LOG("tickleUser sent"), chrome.browserAction.setBadgeBackgroundColor({
                color: greenColor
            }), chrome.browserAction.setBadgeText({
                text: "on"
            }), chrome.browserAction.setIcon({
                path: "img/ckauth19x.png"
            }))
        })).fail((function(data) {
            "192.0.2.1" == ip && (LOG("tickleUser"), tickleUser("192.0.2.2"))
        }))
    }
}

function parsePortIPData(fromIP, data) {
    if (!data) return updateGlobeStatus(!1), void("192.0.2.2" != fromIP ? getCKPortIP("192.0.2.2", parsePortIPData) : (getIpInProgress = !1, thisCKPortIP = ""));
    const startTagIndex = data.indexOf("<get_ck_ip>"),
        endTagIndex = data.indexOf("</get_ck_ip>");
    if (-1 !== startTagIndex && -1 !== endTagIndex) {
        var str0 = data.substring(startTagIndex + 11, endTagIndex);
        try {
            var decryptedMessage = decryptData(str0);
            isWebAssemblyErrorMessage(decryptedMessage) || setPortIpFromMessage(decryptedMessage)
        } catch (exception) {
            console.log("Module not ready")
        }
    }
    getIpInProgress = !1, updateGlobeStatus(!0)
}

function setPortIpFromMessage(message) {
    var xPos = message.search("<x>"),
        ipPos = message.search("<ip>"); - 1 != xPos && -1 != ipPos && (thisChromeIP = message.substring(message.search("<x>") + 3, message.search("</x>")), (thisCKPortIP = message.substring(message.search("<ip>") + 4, message.search("</ip>"))) && (thisChromeIP.match(/^((([01]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))[.]){3}(([0-1]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))$/) || (thisChromeIP = "")))
}

function getCKPortIP(ip, callback) {
    LOG("sending request to " + ip), getIpInProgress = !0;
    var xhr = new XMLHttpRequest;
    xhr.timeout = getCKPortIPTimeout, xhr.onreadystatechange = function(data) {
        if (4 == xhr.readyState)
            if (200 == xhr.status) {
                var dataT = xhr.responseText;
                callback(ip, dataT)
            } else callback(ip, null)
    }, xhr.onerror = function() {
        callback(ip, null)
    };
    var url = "http://" + ip + "/?get_ck_ip";
    url = appendTimeStampToUrl(url), xhr.open("GET", url, !0);
    try {
        xhr.send()
    } catch (e) {
        LOG("exception: ", e), callback(ip, null)
    }
}

function getUserInfo(userInfo) {
    userEmail = userInfo.email, userDomain = userEmail.split("@")[1]
}

function getUserEmail() {
    chrome.identity.getProfileUserInfo((function(userInfo) {
        getUserInfo(userInfo)
    }))
}

function ring() {
    var ringIn = 30;
    if (platformSupported < 1) return chrome.browserAction.setIcon({
        path: "img/ckauths19x.png"
    }), void chrome.browserAction.setBadgeText({
        text: ""
    });
    LOG("ring!"), clearTimeout(timeout), interval = 0, alarmDate = null, localStorage.removeItem("naclReloadTimeout"), userEmail && thisCKPortIP ? userEmail.length < 2 || thisCKPortIP.length < 2 ? (LOG("-------------NO USER EMAIL OR CKPORT IP------------------"), LOG("thisChromeIP is " + thisChromeIP), LOG("thisCKPortIP is " + thisCKPortIP), LOG("userEmail is " + userEmail), LOG("ring in 2 sec"), setAlarm(2e3), chrome.browserAction.setIcon({
        path: "img/ckauths19x.png"
    }), ringIn = 2) : (chrome.browserAction.setBadgeBackgroundColor({
        color: greenColor
    }), chrome.browserAction.setBadgeText({
        text: "on"
    }), LOG("ring in 30 sec"), setAlarm(3e4), chrome.browserAction.setIcon({
        path: "img/ckauth19x.png"
    }), firstRun ? (ringIn = 1, firstRun = !1) : ringIn = 30) : (LOG("-------------NO USER EMAIL OR CKPORT IP------------------"), LOG("thisChromeIP is " + thisChromeIP), LOG("thisCKPortIP is " + thisCKPortIP), LOG("userEmail is " + userEmail), LOG("ring in 2 sec"), setAlarm(2e3), chrome.browserAction.setIcon({
        path: "img/ckauths19x.png"
    }), ringIn = 2), exchangeData(), setAlarm(1e3 * ringIn)
}

function isWebAssemblyErrorMessage(message) {
    return !(!common.isString("string") || message !== webAssemblyInputDataLengthErrorMessage && message !== webAssemblyInputInvalidErrorMessage)
}

function updateGlobeStatus(connected) {
    connected ? (chrome.browserAction.setBadgeBackgroundColor({
        color: greenColor
    }), chrome.browserAction.setBadgeText({
        text: "on"
    })) : (chrome.browserAction.setBadgeBackgroundColor({
        color: redColor
    }), chrome.browserAction.setBadgeText({
        text: "off"
    }))
}

function testWebAssemblyReady() {
    try {
        encryptData("myDomain.com");
        moduleInitialized = !0, LOG("Success. Web assembly succeeded"), onCkDomContentLoaded()
    } catch (exception) {
        LOG("Failed to call web assembly. Retrying"), setTimeout((() => {
            testWebAssemblyReady()
        }), retryTestWebAssemblyTime)
    }
}
chrome.webRequest.onAuthRequired.addListener(provideCredentialsAsync, {
    urls: [target]
}, ["asyncBlocking"]), chrome.webRequest.onCompleted.addListener(completed, {
    urls: [target]
}), chrome.webRequest.onErrorOccurred.addListener(completed, {
    urls: [target]
}), chrome.webRequest.onHeadersReceived.addListener((function(details) {
    if (!(platformSupported < 1)) {
        var headers = details.responseHeaders,
            i = 0;
        for (i = 0; i < headers.length; i++)
            if (nHeader = headers[i], "X-CKBYOD" == nHeader.name) {
                LOG("found authentication hash!"), ckIDHash = nHeader.value, chrome.browserAction.setBadgeBackgroundColor({
                    color: greenColor
                }), chrome.browserAction.setBadgeText({
                    text: "on"
                }), chrome.browserAction.setIcon({
                    path: "img/ckauth19x.png"
                });
                break
            }
    }
}), {
    urls: ["http://*/*"]
}, ["responseHeaders"]), chrome.webRequest.onBeforeSendHeaders.addListener((function(details) {
    var headers = details.requestHeaders,
        url = details.url,
        ippos1 = url.search("192.0.2.1"),
        ippos2 = url.search("192.0.2.2"),
        i = 0,
        l = headers.length;
    if (ckIDHash.length > 1)
        for (i = 0, l = headers.length; i < l; ++i)
            if ("User-Agent" == headers[i].name) {
                headers[i].value = headers[i].value + "ck={" + ckIDHash + "}", LOG(headers[i].value);
                break
            } return (ippos1 > 0 || ippos2 > 0) && i < headers.length && (headers[i].value = "CKAuthenticator/Chromebook"), {
        requestHeaders: headers
    }
}), requestFilter, ["requestHeaders"]), setAlarm(2e3);