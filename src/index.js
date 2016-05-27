/**
 * 微信 JSSDK 封装
 * @author ydr.me
 * @create 2015-12-15 10:40
 * @update 2016年05月27日15:50:59
 * @doc https://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html
 * @check https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=jsapisign
 */


var string = require('blear.utils.string');
var object = require('blear.utils.object');
var fun =    require('blear.utils.function');
var typeis = require('blear.utils.typeis');
var array =  require('blear.utils.array');
var Class =  require('blear.classes.class');


var wx = require('./_weixin');


var JS_API_LIST = ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'startRecord', 'stopRecord', 'onVoiceRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'onVoicePlayEnd', 'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'translateVoice', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'closeWindow', 'scanQRCode', 'chooseWXPay', 'openProductSpecificView', 'addCard', 'chooseCard', 'openCard'];
var CHOOSE_WXPAY_MSG_MAP = {
    fail: '支付过程出现错误',
    cancel: '你已取消支付'
};

var ua = navigator.userAgent;
var parseUA = function (type) {
    var reg = new RegExp(string.escapeRegExp(type) + '\/([^ ]*)', 'i');

    return ua.match(reg) || ['', ''];
};
var uaMicroMessenger = parseUA('MicroMessenger');
var uaNetType = parseUA('NetType');
var uaLanguage = parseUA('Language');

var STATE_INIT = 0;
var STATE_READY = 1;
var STATE_BROKEN = 2;
var defaults = {
    debug: typeof DEBUG !== 'undefined' && DEBUG === true,
    appId: '',
    timestamp: '',
    nonceStr: '',
    signature: '',
    jsApiList: JS_API_LIST
};
var Weixin = Class.extend({
    className: 'Weixin',
    constructor: function () {
        var the = this;

        the.configs = null;
        the.shareData = {};
        the[_state] = STATE_INIT;
        the[_readyCallbacks] = [];
        the[_brokenCallbacks] = [];
    },


    /**
     * 配置微信 JSSDK
     * @param configs {Object}
     * @param configs.appId {String} appId
     * @param configs.timestamp {Number} 签名的时间戳
     * @param configs.nonceStr {String} 生成签名的随机串
     * @param configs.signature {String} 签名
     * @returns {Weixin}
     */
    config: function (configs) {
        var the = this;

        if (the.configs) {
            if (typeof DEBUG !== 'undefined' && DEBUG === true) {
                console.warn('重复配置了微信 JSSDK');
            }

            return the;
        }

        the.configs = object.assign({}, defaults, configs);
        wx.config(the.configs);
        return the;
    },


    /**
     * 微信 JSSDK 加载成功后调用
     * @param callback {Function} 回调
     * @returns {Weixin}
     */
    ready: function (callback) {
        var the = this;

        if (!typeis.Function(callback)) {
            return the;
        }

        if (the[_state] === STATE_READY) {
            callback.call(the);
        } else {
            the[_readyCallbacks].push(callback);
        }

        return the;
    },


    /**
     * 微信 JSSDK 加载失败后调用
     * @param callback {Function} 回调
     * @returns {Weixin}
     */
    broken: function (callback) {
        var the = this;

        if (!typeis.Function(callback)) {
            return the;
        }

        if (the[_state] === STATE_BROKEN) {
            callback.call(the);
        } else {
            the[_brokenCallbacks].push(callback);
        }

        return the;
    },


    /**
     * 设置分享数据
     * @param shareData {Object}
     * @param shareData.title {String} 分享的标题
     * @param shareData.desc {String} 分享的描述
     * @param shareData.link {String} 分享的链接
     * @param shareData.img {String} 分享的图片
     * @returns {Weixin}
     */
    shareData: function (shareData) {
        var the = this;

        shareData = object.assign(the.shareData, shareData);
        shareData.imgUrl = shareData.img;
        wx.onMenuShareTimeline(shareData);
        wx.onMenuShareAppMessage(shareData);
        wx.onMenuShareQQ(shareData);
        wx.onMenuShareQZone(shareData);
        wx.onMenuShareWeibo(shareData);
    },


    /**
     * 判断是否支持某个 API
     * @param api {String} api 名称
     * @param callback {Function} 回调
     * @returns {Weixin}
     */
    support: function (api, callback) {
        var the = this;

        try {
            wx.checkJsApi({
                jsApiList: [api],
                complete: the[_callbackWrapper](function (err) {
                    callback(!err);
                })
            });
        } catch (err) {
            controller.nextTick(function () {
                callback(false);
            });
        }

        return the;
    },


    /**
     * 预览图片
     * @param [data.active=0]
     * @param data.list
     * @returns {Weixin}
     */
    previewImage: function (data) {
        var the = this;

        data.activ = data.activ || 0;
        wx.previewImage({
            current: data.list[data.active],
            urls: data.list
        });

        return the;
    },


    /**
     * 获取地理位置信息
     * @param callback
     * return var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
     * return var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
     * return var speed = res.speed; // 速度，以米/每秒计
     * return var accuracy = res.accuracy; // 位置精度
     * @returns {Weixin}
     */
    getLocation: function (callback) {
        var the = this;

        wx.getLocation({
            type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
            success: the[_callbackWrapper](callback)
        });

        return the;
    },


    /**
     * 隐藏右上角菜单
     * @returns {Weixin}
     */
    hideOptionMenu: function () {
        var the = this;
        wx.hideOptionMenu();
        return the;
    },


    /**
     * 隐藏右上角菜单
     * @returns {Weixin}
     */
    showOptionMenu: function () {
        var the = this;
        wx.showOptionMenu();
        return the;
    },


    /**
     * 微信支付
     * @param signature {Object} 签名信息
     * @param signature.timestamp {Number} 支付签名时间戳
     * @param signature.nonceStr {String} 支付签名随机串，不长于 32 位
     * @param signature.package {String} 统一支付接口返回的prepay_id参数值
     * @param [signature.signType="MD5"] {String} 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
     * @param signature.paySign {String} 支付签名
     * @param [callback] {Function} 回调
     * @returns {Weixin}
     */
    chooseWXPay: function (signature, callback) {
        var the = this;
        var configs = the.configs;
        var data = object.assign({
            signType: 'MD5',
            appId: configs.appId
        }, signature);

        the.support('chooseWXPay', function (support) {
            if (!support) {
                return callback(new Error('当前微信客户端不支持微信支付'));
            }

            data.complete = the[_callbackWrapper](function (err) {
                if (!err) {
                    return callback();
                }

                var errMsg = CHOOSE_WXPAY_MSG_MAP[err.type] || CHOOSE_WXPAY_MSG_MAP.fail;
                callback(new Error(errMsg))
            });
            wx.chooseWXPay(data);
        });

        return the;
    }
});
var _initEvent = Weixin.sole();
var _timeId = Weixin.sole();
var _onReady = Weixin.sole();
var _onError = Weixin.sole();
var _state = Weixin.sole();
var _readyCallbacks = Weixin.sole();
var _brokenCallbacks = Weixin.sole();
var _callbackWrapper = Weixin.sole();


Weixin.method(_initEvent, function () {
    var the = this;

    the[_timeId] = setTimeout(function () {
        the[_onError]();
    }, 2000);

    // 旧接口
    document.addEventListener('WeixinJSBridgeReady', the[_onReady].bind(the));
});


Weixin.method(_onReady, function () {
    var the = this;

    if (the[_state] > STATE_INIT) {
        return;
    }

    clearTimeout(the[_timeId]);
    the[_state] = STATE_READY;
    array.each(the[_readyCallbacks], function (index, callback) {
        callback.call(the);
    });
});

Weixin.method(_onError, function (res) {
    var the = this;

    if (the[_state] > STATE_INIT) {
        return;
    }

    clearTimeout(the[_timeId]);
    the[_state] = STATE_BROKEN;
    array.each(the[_brokenCallbacks], function (index, callback) {
        callback.call(the);
    });
});


Weixin.method(_callbackWrapper, function (callback) {
    return function (res) {
        if (!typeis.Function(callback)) {
            return;
        }

        var resList = (res.errMsg || 'api:ok').split(':');
        var name = resList[0].trim();
        var type = resList[1].trim().toLowerCase();

        if (type === 'ok') {
            return callback();
        }

        var err = new Error(res.errMsg);
        err.name = name;
        err.type = type;
        callback(err);
    };
});

var weixin = new Weixin();
wx.ready(fun.bind(weixin[_onReady], weixin));
wx.error(fun.bind(weixin[_onError], weixin));
weixin.wx = wx;
weixin.is = !!uaMicroMessenger[0];
weixin.version = uaMicroMessenger[1] || '0.0.0';
weixin.netWork = uaNetType[1];
weixin.language = uaLanguage[1];

module.exports = weixin;
