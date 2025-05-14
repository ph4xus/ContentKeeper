var refreshDisplayTimeout, bgpage = chrome.extension.getBackgroundPage(),
    previousValues = [3, 5, 10, 30],
    editing = !1,
    running = !1;

function show(section) {
    document.getElementById(section).style.display = "block"
}

function showInline(section) {
    document.getElementById(section).style.display = "inline"
}

function hide(section) {
    document.getElementById(section).style.display = "none"
}

function load() {
    if (chrome.extension.getBackgroundPage().LOG("***** run"), show("display"), editing = !1, bgpage.alarmDate) show("display"), refreshDisplay();
    else
        for (var i = 0; i < document.choices.radio.length; i++) null != localStorage[i] && (document.getElementById("s" + i).textContent = localStorage[i]);
    bgpage.alarmDate || setTimer()
}

function swap() {
    editing = !0;
    for (var i = 0; i < document.choices.radio.length; i++) {
        var span = document.getElementById("s" + i),
            num = parseInt(span.textContent);
        previousValues[i] = num;
        var html = "<input class='input-mini' type='text' name='custom' id='c" + i;
        html += "' value='" + num, html += "'>", span.innerHTML = html
    }
    document.getElementById("swapper").innerHTML = "<a href='#' id='done' class='btn'><i class='icon-ok'></i></a>", document.querySelector("#done").addEventListener("click", swapBack)
}

function swapBack() {
    for (var i = 0; i < document.choices.radio.length; i++) {
        var span = document.getElementById("s" + i),
            num = parseInt(document.getElementById("c" + i).value);
        isValid(num) ? (localStorage[i] = num, span.textContent = num) : span.textContent = previousValues[i]
    }
    document.getElementById("swapper").innerHTML = "<a href='#' id='wrench' class='btn'><i class='icon-wrench'></i></a>", document.querySelector("#wrench").addEventListener("click", swap), editing = !1
}

function setTimer() {
    running = !0, editing && swapBack();
    isValid(.5) ? (bgpage.setAlarm(3e4), show("display"), refreshDisplay()) : bgpage.error()
}

function isValid(amt) {
    return !isNaN(amt) && null != amt && !(amt < 0 || amt > 240)
}

function refreshDisplay() {
    percent = bgpage.getTimeLeftPercent(), percent < 15 && (document.getElementById("bar").style.color = "grey"), document.getElementById("bar").textContent = bgpage.getTimeLeftString(), document.getElementById("bar").style.width = percent + "%", document.getElementById("uname").textContent = "Logged on as: " + bgpage.userEmail, usernameUpdated(), refreshDisplayTimeout = setTimeout(refreshDisplay, 100)
}

function pauseTimer() {
    bgpage.pause(), clearTimeout(refreshDisplayTimeout)
}

function resumeTimer() {
    refreshDisplay(), bgpage.resume()
}

function restartTimer() {
    refreshDisplay(), bgpage.restart()
}

function reset() {
    clearTimeout(refreshDisplayTimeout), bgpage.turnOff(), show("display")
}

function getTextElement() {
    return document.getElementsByClassName("textWidth")[0]
}

function updateBodyWidth() {
    var textWidth = getTextElement().clientWidth,
        bodyElement = document.getElementsByTagName("body")[0],
        bodyWidth = bodyElement.clientWidth < textWidth && textWidth > 300 ? textWidth : 300;
    bodyElement.style.width = bodyWidth + "px"
}

function updateElementText(text) {
    getTextElement().innerText = text
}

function usernameUpdated() {
    updateElementText("Logged on as: " + bgpage.userEmail), updateBodyWidth()
}
document.addEventListener("DOMContentLoaded", (function() {
    load()
}));