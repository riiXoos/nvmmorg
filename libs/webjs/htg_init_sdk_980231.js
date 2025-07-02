/**
 * 游戏初始化sdk
 */
var HtgInitSdk = /** @class */ (function () {
    function HtgInitSdk() {
        /**
         * manifest.json文件数据
         */
        this.manifestData = {};
        /**
         * egret是否已启动
         */
        this.setuped = false;
        /** 
         * 资源地址
         */
        this.resServer = "./";
    }
    /**
     * 加载游戏manifest.json文件
     */
    HtgInitSdk.prototype.start = function () {
        /** 版本号数据({mini(小游戏): 2, native(原生包): 1, web(网页): 3, temp(模板):5}) */
        this.versionData = window.versionData || {};

        this.tempVer = "_" + (this.versionData.temp || 0);

        this.webVer = "";

        if(!window.client_local)
        {
            this.webVer = "_" + (this.versionData.web || 0);
        }

        var htgConfig = window.htgConfig || {};

        this.resServer = (htgConfig && htgConfig.resServer) || "./";

        this.requestManifestData();
    };
    
    /**
     * 请求manifest.json数据
     */
    HtgInitSdk.prototype.requestManifestData = function () {
        var _this = this;
        var _url = this.resServer + "manifest" + this.webVer + ".json";
        _this.httpRequest(_url, function(res) {
            if (res && res.code == 1) {
                _this.manifestData = res.data;
                _this.loadInitScript();
            } else {
                console.log("请求文件失败!", _url);
            }
        })
    };
    /**
     * http请求
     */
    HtgInitSdk.prototype.httpRequest = function ($url, $callback) {
        var xhr = new XMLHttpRequest();
        var __manifestComplete = function () {
            if(xhr.readyState == 4) {
                xhr.onreadystatechange = null;
                var resdata = {code:0, data:null};
                try {
                    var jsondata = JSON.parse(xhr.response || "");
                    resdata.code = 1;
                    resdata.data = jsondata;
                } catch (e) {
                    
                } finally {
                    typeof $callback == "function" && $callback(resdata);
                }
            }
        };
        xhr.onreadystatechange = __manifestComplete;
        xhr.open("GET", $url, true);
        xhr.send(null);
    }
    /**
     * 开始加载游戏初始js文件
     */
    HtgInitSdk.prototype.loadInitScript = function () {
        var _this = this;

        if(!_this.manifestData)
        {
            console.log("未定义对象manifestData");

            return;
        }
        
        //所有需要加载的js文件
        var libList = [];

        if(!window.client_local && window.HTG_ENT_TYPE == "web")
        {
            libList.push("//int-client.hhycdk.com/hitalksdk.js");
        }

        if(window.HTG_ENT_TYPE == "native_ios")
        {
            //ios 原生包接入sdk
            libList.push(this.resServer + "libs/webjs/htg_platform_nativesdk_ios" + this.webVer + ".js");
        }
        else if(window.HTG_ENT_TYPE == "native_android")
        {
            //android 原生包接入sdk
            libList.push(this.resServer + "libs/webjs/htg_platform_nativesdk_android" + this.webVer + ".js");
        }
        else if(window.HTG_ENT_TYPE == "android_mini")
        {
            //android 微端包接入sdk
            libList.push("./libs/webjs/htg_platform_nativesdk_android_mini" + this.webVer + ".js");
        }
        else
        {
            libList.push(this.resServer + "libs/webjs/htg_platform_sdk" + this.webVer + ".js");
        }
        
        //游戏初始js文件
        var initList = (_this.manifestData.initial || []);

        var jslist = [];

        var len = initList.length;

        for(var i = 0; i < len; i ++)
        {
            jslist.push(this.resServer + initList[i]);
        }

        jslist = jslist.concat(libList);

        _this.loadListScript(jslist, _this.__initScriptComplete.bind(_this));
    };
    /**
     * 加载游戏js文件
     * @param progCall 加载进度通知回调方法
     * @param overCall 加载结束回调方法
     */
    HtgInitSdk.prototype.loadGameScript = function (progCall, overCall) {

        var _this = this;

        if(!_this.manifestData)
        {

            console.log("未定义对象manifestData");

            return;
        }

        //游戏js文件
        var gameList = _this.manifestData.game || [];

        var jslist = [];

        var len = gameList.length;

        for(var i = 0; i < len; i ++)
        {
            jslist.push(this.resServer + gameList[i]);
        }

        _this.loadListScript(jslist, function () {

            overCall && overCall(true);

        });
    };
    /**
     * 初始js文件加载完成，启动egret
     * @private
     */
    HtgInitSdk.prototype.__initScriptComplete = function () {
        var egret = window["egret"];
        if (!egret) {
            console.error("游戏启动失败！找不到egret");
            return;
        }
        if (this.setuped) {
            console.log("请勿多次启动游戏！");
            return;
        }
        this.setuped = true;
        egret.runEgret({ renderMode: "webgl", audioType: 0, calculateCanvasScaleFactor: function (context) {
                var backingStore = context.backingStorePixelRatio ||
                    context.webkitBackingStorePixelRatio ||
                    context.mozBackingStorePixelRatio ||
                    context.msBackingStorePixelRatio ||
                    context.oBackingStorePixelRatio ||
                    context.backingStorePixelRatio || 1;
                return (window.devicePixelRatio || 1) / backingStore;
            } });
    };
    /**
     * 加载单个js文件
     * @param url js文件路径
     * @param callback 回调方法
     */
    HtgInitSdk.prototype.loadSingleScript = function (url, callback) {
        var elm = document.createElement('script');
        elm.async = false;
        elm.src = url;
        var __loadComplete = function () {
            elm.parentNode && elm.parentNode.removeChild(elm);
            elm.removeEventListener('load', __loadComplete, false);
            callback && callback();
        };
        elm.addEventListener('load', __loadComplete, false);
        document.body.appendChild(elm);
    };
    /**
     * 加载js列表
     * @param list js文件路径列表
     * @param callback 回调方法
     */
    HtgInitSdk.prototype.loadListScript = function (list, callback) {
        var loaded = 0;
        var length = list ? list.length : 0;
        if (!length) {
            callback && callback();
            return;
        }
        var _this = this;
        var __loadNext = function () {
            loaded++;
            if (loaded >= length) {
                callback && callback();
            }
            else {
                _this.loadSingleScript(list[loaded], __loadNext);
            }
        };
        _this.loadSingleScript(list[loaded], __loadNext);
    };
    /**
     * 隐藏loadingDiv
     */
    HtgInitSdk.prototype.hideLoadingDiv = function () {
        var loadingDiv = document.getElementById("loadingDiv");
        if (loadingDiv && loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
    };

    return HtgInitSdk;
}());
/**
 * 游戏初始sdk对象
 */
window.htgInitSdk = new HtgInitSdk();
htgInitSdk.start();