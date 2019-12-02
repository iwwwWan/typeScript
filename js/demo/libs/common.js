var USER_TOKEN = '';
var pointId = getUrlParam('id') ? getUrlParam('id') : '';
var API_PRE_URL = 'https://appv3.devcenter.lingkehudong.com'; // 测试服务器地址
// var API_PRE_URL = 'http://192.168.0.142:9092';
var watermarkId = getUrlParam('watermarkId') ? getUrlParam('watermarkId') : 0;
var API_PRE_URL = 'https://appv3.devcenter.lingkehudong.com'; // 测试服务器地址
var appV3_API_PRE_URL = 'https://appv3.devcenter.lingkehudong.com/'; // 3.0测试服务器地址
var SHOP_PRE_URL = 'https://constant-info-dev.lingkehudong.com/'; // 商城地址前缀
var url = 'http://constant-info-dev.lingkehudong.com/huDong/Main/index.html';
var protocol = new Protocol(function () { }, function () { });
var pro = false; // 开发 false  生产 true
var wechat = getUrlParam('wechat') ? getUrlParam('wechat') : localStorage.getItem('wechat') ? localStorage.getItem('wechat') : null;
if (wechat) {
    localStorage.setItem('wechat', wechat);
}
if (pro) {
    appV3_API_PRE_URL = 'https://api.lingkehudong.com/'; // 3.0正式服务器地址
    API_PRE_URL = "https://api.lingkehudong.com";
    SHOP_PRE_URL = 'https://constant-info.lingkehudong.com/';
}
else {
    // loadScript('//cdn.jsdelivr.net/npm/eruda') 
}
function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg); //匹配目标参数
    if (r != null)
        return decodeURI(r[2]);
    return null; //返回参数值
}
function loadScriptPublic(url) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}
// 动态创建script标签
function loadScript(url) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
    script.onload = function () {
        eruda.init();
    };
}
// 返回首页按钮
function backBtn(url, str) {
    if (/(LKHDAPP)/i.test(navigator.userAgent)) {
        protocol.setBackButton({ homeName: '', homeUrl: url, backName: str });
    }
}
// 全屏广告
function pushAD() {
    if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
        protocol.pushADView({ 'type': 'splash', 'placementId': '7050540725229324' });
    }
    else if (/(Android)/i.test(navigator.userAgent)) {
        protocol.pushADView({ 'type': 'splash', 'placementId': '1020344338680450' });
    }
}
// 分享按钮
function shareBtn(num, type, urlData) {
    urlData = urlData ? urlData : '';
    var Newstr = { 'number': num, 'type': type, 'parameterStr': urlData };
    protocol.share(Newstr, function (res) { });
}
// 单页面应用调用客户端弹幕
function sendPointId(params, callback) {
    protocol.sendPointId(params, callback);
}
// 个人中心
function intoMy(callback) {
    var pageCode = '';
    if (protocol.isIOS()) {
        pageCode = 'LTVMeViewController';
    }
    else if (protocol.isAndroid()) {
        pageCode = 'MineFragment';
    }
    protocol.jumpController(pageCode, callback);
}
function getPointId() {
    if (pointId == '') {
        pointId = getUrlParam('id');
    }
    return pointId;
}
/**
 * @param {参数} params
 * url 图片地址
 */
// 拍摄照片
function takePhoto(params, callback) {
    protocol.takePhoto(params, callback);
}
// 保存照片
function savePhoto(params, callback) {
    protocol.savePhoto(params, callback);
}
// 3.0跳转到webview，url需要encodeURI,已处理小程序的环境
function jumpToWebView(params, callback) {
    if (!/(LKHDAPP)/i.test(navigator.userAgent)) {
        var tempURL = decodeURIComponent(params);
        if (tempURL.indexOf('?') > 0) {
            tempURL += '&wechat=1';
        }
        else {
            tempURL += '?wechat=1';
        }
        window.location.href = tempURL;
    }
    else {
        protocol.jumpWebViewController(params, callback);
    }
}
/**
 *
 * @param {参数} params
 * 电话号
 * @param {回调} callback
 */
// 打电话
function photoCall(params, callback) {
    protocol.photoCall(params, callback);
}
// 震动
function vibrate(params, callback) {
    protocol.vibrate(params, callback);
}
// 跳转到道具购买页 
function jumpController(className, callback) {
    protocol.jumpController(className, callback);
}
function protocolLoaded(callback) {
    var token = "";
    setTimeout(function () {
        window.protocol.getToken(function (token) {
            callback(token);
        });
    }, 0);
}
;
// 二次封装jQ.ajax
function getData(url, data, callback) {
    $.ajax({
        url: API_PRE_URL + url,
        type: "post",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(data),
        success: callback,
        error: callback
    });
}
// 利用ajax 提供的 deferred
function getDataPromise(url, data) {
    return $.ajax({
        url: API_PRE_URL + url,
        timeout: 3000,
        type: "post",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(data),
    });
}
// 请求3.0接口
function getDataPromiseV3(url, data) {
    return $.ajax({
        url: appV3_API_PRE_URL + url,
        timeout: 3000,
        type: "post",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(data),
    });
}
/**
 * 3.0设置互动分享按钮
 * @param {setButton:true,type:'type'} params
 * setButton:是否让分享按钮显示
    type:分享的type
*/
function setShareButton(params) {
    protocol.setShareButton(params);
}
window.onload = function () {
    protocol.initPromise(function () {
        window.protocolLoaded(function (tokenVal) {
            window.loadPageContent(tokenVal);
        });
    });
};
