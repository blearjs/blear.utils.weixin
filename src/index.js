/**
 * 微信 JSSDK 封装
 * @author ydr.me
 * @create 2015-12-15 10:40
 * @update 2016年05月27日15:50:59
 * @doc https://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html
 * @check https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=jsapisign
 */


if (typeof wx === 'undefined') {
    if (typeof DEBUG !== 'undefined' && DEBUG) {
        throw new SyntaxError('需要先引入官网 jssdk 脚本，详细文档参考 https://blear.ydr.me/utils/weixin');
    }

    return;
}

var string = require('blear.utils.string');
var object = require('blear.utils.object');
var fun = require('blear.utils.function');
var typeis = require('blear.utils.typeis');
var time = require('blear.utils.time');
var array = require('blear.utils.array');
var Class = require('blear.classes.class');
var Error = require('blear.classes.error');

var JS_API_LIST = ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'startRecord', 'stopRecord', 'onVoiceRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'onVoicePlayEnd', 'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'translateVoice', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'closeWindow', 'scanQRCode', 'chooseWXPay', 'openProductSpecificView', 'addCard', 'chooseCard', 'openCard'];
var SHARE_MENUS = [
    "menuItem:share:appMessage",
    "menuItem:share:timeline",
    "menuItem:share:qq",
    "menuItem:share:weiboApp",
    "menuItem:favorite",
    "menuItem:share:facebook",
    "menuItem:share:QZone"
];
var EXTERNAL_MENUS = [
    "menuItem:editTag",
    "menuItem:delete",
    // "menuItem:copyUrl",
    "menuItem:originPage",
    "menuItem:readMode",
    "menuItem:openWithQQBrowser",
    "menuItem:openWithSafari",
    "menuItem:share:email",
    "menuItem:share:brand"
];
var geolocationCallbackList = [];
var ua = navigator.userAgent;
var parseUA = function (type) {
    var reg = new RegExp(string.escapeRegExp(type) + '\/([^ ]*)', 'i');

    return ua.match(reg) || ['', ''];
};
var uaMicroMessenger = parseUA('MicroMessenger');
var uaWswechat = ua.match(/WindowsWechat/);
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
        the.shareData = {
            type: 'link',
            data: ''
        };
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
     * @param shareData.timelineDesc {String} 分享到朋友圈的描述
     * @param shareData.link {String} 分享的链接
     * @param shareData.img {String} 分享的图片
     * @param [shareData.type] {String} 分享的类型
     * @param [shareData.data] {String} 分享的内容
     * @returns {Weixin}
     */
    share: function (shareData) {
        var the = this;

        shareData = object.assign(the.shareData, shareData);
        wx.onMenuShareTimeline({
            title: shareData.timelineDesc || shareData.title, // 分享标题
            link: shareData.link, // 分享链接
            imgUrl: shareData.img // 分享图标
        });
        wx.onMenuShareAppMessage({
            title: shareData.title, // 分享标题
            desc: shareData.desc, // 分享描述
            link: shareData.link, // 分享链接
            imgUrl: shareData.img, // 分享图标
            type: shareData.type, // 分享类型，music、video或link，不填默认为link
            dataUrl: shareData.data // 如果type是music或video，则要提供数据链接，默认为空
        });
        wx.onMenuShareQQ({
            title: shareData.title, // 分享标题
            desc: shareData.desc, // 分享描述
            link: shareData.link, // 分享链接
            imgUrl: shareData.img // 分享图标
        });
        wx.onMenuShareQZone({
            title: shareData.title, // 分享标题
            desc: shareData.desc, // 分享描述
            link: shareData.link, // 分享链接
            imgUrl: shareData.img // 分享图标
        });
        wx.onMenuShareWeibo({
            title: shareData.title, // 分享标题
            desc: shareData.desc, // 分享描述
            link: shareData.link, // 分享链接
            imgUrl: shareData.img // 分享图标
        });
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
     * 获取地理位置信息，同时调用会出错，回调最后一次 callback，故此使用一个 list 来维护，保证微信 js 只回调一次
     * @param callback
     * return var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
     * return var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
     * return var speed = res.speed; // 速度，以米/每秒计
     * return var accuracy = res.accuracy; // 位置精度
     * @returns {Weixin}
     */
    getLocation: function (callback) {
        var the = this;

        if (geolocationCallbackList.length) {
            geolocationCallbackList.push(callback);
            return the;
        }

        geolocationCallbackList.push(callback);
        wx.getLocation({
            type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
            complete: the[_callbackWrapper](geolocationCallbackList)
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
     * 隐藏分享按钮
     * @returns {Weixin}
     */
    hideShareMenus: function () {
        var the = this;
        wx.hideMenuItems({
            menuList: SHARE_MENUS
        });
        return the;
    },


    /**
     * 隐藏扩展类按钮
     * @returns {Weixin}
     */
    hideExternalMenus: function () {
        var the = this;
        wx.hideMenuItems({
            menuList: EXTERNAL_MENUS
        });
        return the;
    },


    /**
     * 隐藏分享按钮
     * @returns {Weixin}
     */
    showShareMenus: function () {
        var the = this;
        wx.showMenuItems({
            menuList: SHARE_MENUS
        });
        return the;
    },


    /**
     * 隐藏分享按钮
     * @returns {Weixin}
     */
    showExternalMenus: function () {
        var the = this;
        wx.showMenuItems({
            menuList: EXTERNAL_MENUS
        });
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
    pay: function (signature, callback) {
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

            data.complete = the[_callbackWrapper](callback);
            wx.chooseWXPay(data);
        });

        return the;
    },


    /**
     * 扫码
     * @param auto {Boolean} 是否自动处理
     * @param callback
     * @returns {Weixin}
     */
    scan: function (auto, callback) {
        var the = this;
        wx.scanQRCode({
            needResult: auto ? 0 : 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
            scanType: ["qrCode", "barCode"], // 可以指定扫二维码还是一维码，默认二者都有
            complete: the[_callbackWrapper](callback)
        });
        return the;
    },


    /**
     * 上传单张图片
     * @param callback
     * @returns {Weixin}
     */
    upload: function (callback) {
        var the = this;

        wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            complete: the[_callbackWrapper](function (err, res) {
                if (err) {
                    return callback(err);
                }

                wx.uploadImage({
                    localId: res.localIds[0], // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                    complete: the[_callbackWrapper](callback)
                });
            })
        });

        return the;
    }
});
var sole = Weixin.sole;
var _onReady = sole();
var _onError = sole();
var _state = sole();
var _readyCallbacks = sole();
var _brokenCallbacks = sole();
var _callbackWrapper = sole();
var _callbackListWrapper = sole();
var pro = Weixin.prototype;


pro[_onReady] = function () {
    var the = this;

    if (the[_state] > STATE_INIT) {
        return;
    }

    the[_state] = STATE_READY;
    array.each(the[_readyCallbacks], function (index, callback) {
        callback.call(the);
    });
};

pro[_onError] = function (res) {
    var the = this;

    if (the[_state] > STATE_INIT) {
        return;
    }

    the[_state] = STATE_BROKEN;
    array.each(the[_brokenCallbacks], function (index, callback) {
        callback.call(the);
    });
};


// 回调列表回调生成器
pro[_callbackListWrapper] = function (callbackList) {
    return function () {
        while (callbackList.length) {
            var callback = callbackList.pop();
            callback = fun.noop(callback);
            callback.apply(this, arguments);
        }
    };
};


// 回调包装器
pro[_callbackWrapper] = function (callback) {
    var the = this;

    if (typeis.Array(callback)) {
        callback = the[_callbackListWrapper](callback);
    }

    callback = fun.noop(callback);

    return function (res) {
        if (typeof DEBUG !== 'undefined' && DEBUG) {
            console.log('response:', res);
        }

        var msg = res.errMsg;
        delete(res.errMsg);
        var resList = (msg || 'api:ok').split(':');
        // var name = string.trim(resList[0] || '');
        var type = string.trim(resList[1] || '').toLowerCase();

        if (type === 'ok') {
            return callback(null, res);
        }

        switch (type) {
            case 'cancel':
                msg = '操作取消';
                break;

            case 'fail':
                msg = '客户端错误';
                break;
        }

        callback(new Error(type, msg));
    };
};

var weixin = new Weixin();
wx.ready(fun.bind(weixin[_onReady], weixin));
wx.error(fun.bind(weixin[_onError], weixin));
weixin.wx = wx;
weixin.is = uaWswechat || !!uaMicroMessenger[0];
weixin.version = uaMicroMessenger[1] || '0.0.0';
weixin.netWork = uaNetType[1];
weixin.language = uaLanguage[1];

// windows 版微信内嵌浏览器不会主动触发 ready 事件
if (uaWswechat) {
    time.nextTick(fun.bind(weixin[_onReady], weixin));
}

if (!weixin.is) {
    time.nextTick(fun.bind(weixin[_onError], weixin));
}

module.exports = weixin;
