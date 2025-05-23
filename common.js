const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var UNDEFINED, isTest = !1,
    isRelease = !0;
LOG("Common loaded");
var common = function() {
    var logMessageArray = [];

    function logMessage(message) {
        logMessageArray.push(message), logMessageArray.length > 20 && logMessageArray.shift(), document.getElementById("log").textContent = logMessageArray.join("\n"), LOG(message)
    }
    alert;
    var statusText = "NO-STATUSES";

    function updateStatus(opt_message) {
        opt_message && (statusText = opt_message);
        var statusField = document.getElementById("statusField");
        statusField && (statusField.innerHTML = statusText)
    }
    return {
        domContentLoaded: function() {
            updateStatus("Page loaded."), window.onCkDomContentLoaded && window.onCkDomContentLoaded()
        },
        logMessage: logMessage,
        updateStatus: updateStatus,
        isString: function(data) {
            return "string" == typeof data
        }
    }
}();

function LOG() {
    var output = "";
    if (defined(arguments)) {
        var date = new Date;
        const monthIndex = date.getMonth(),
            monthName = months[monthIndex],
            dayIndex = date.getDay(),
            dayName = days[dayIndex],
            year = date.getFullYear(),
            day = date.getDate();
        let hours = date.getHours() + "";
        hours = 1 === hours.length ? "0" + hours : hours;
        let minutes = date.getMinutes() + "";
        minutes = 1 === minutes.length ? "0" + minutes : minutes;
        let seconds = date.getSeconds() + "";
        seconds = 1 === seconds.length ? "0" + seconds : seconds;
        for (var dateOutput = `${dayName}, ${day} ${monthName} ${year} ${`${hours}:${minutes}:${seconds}`} - `, i = 0; i < arguments.length; i++) {
            i > 0 && i <= arguments.length && (output += " - ");
            var value = arguments[i];
            output += "object" == typeof value ? JSON.stringify(value) : value
        }
        console.log(dateOutput, output)
    }
}

function defined(value) {
    return null != value && value != UNDEFINED
}

function appendTimeStampToUrl(url) {
    try {
        var urlObject = new URL(url),
            timestamp = (new Date).getTime(),
            tsQueryParam = getParameterByName("ts", url);
        return tsQueryParam ? url.replace(`ts=${tsQueryParam}`, `ts=${timestamp}`) : urlObject.search && -1 !== urlObject.search.indexOf("?") ? `${url}&ts=${timestamp}` : `${url}?ts=${timestamp}`
    } catch (exception) {
        return url
    }
}

function getParameterByName(name, url) {
    url || (url = window.location.href), name = name.replace(/[\[\]]/g, "\\$&");
    var results = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)").exec(url);
    return results ? results[2] ? decodeURIComponent(results[2].replace(/\+/g, " ")) : "" : null
}