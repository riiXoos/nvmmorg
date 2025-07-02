/**
 * 游戏对接平台sdk
 */
var HtgPlatformSdk = /** @class */ (function () {
    function HtgPlatformSdk() {
        /**
         * url参数对象
         */
        this.urlParam = {};
        /**
         * 资源文件时间戳
         */
        this.RES_TIMESTAMP = 980231;
        /**
         * 平台sdk对象
         */
        this.htgSdk = null;
        /**
         * 游戏登录接口回调
         */
        this.loginCallback = null;
        /**
         * 游戏登录接口回调this
         */
        this.loginthisobj = null;
        /**
         * 游戏内提示消息方法
         */
        this.gameMsgFun = null;
        /**
         * 游戏内提示方法this
         */
        this.gameMsgObj = null;
        /** 
         * 平台sdk初始化完 
         */
        this.sdk_inited = false;
        /** 
         * 浏览器显示大小数据
         */
        this.safeSizeData = null;
        /**
         * 顶部div
         */
        this.top_div = null;
        /**
         * 底部div
         */
        this.bottom_div = null;
    }
    /**
     * sdk启动
     */
    HtgPlatformSdk.prototype.setup = function () {
        this.initURLParam();
        this.initOpenSDk();

        var _this = this;

        window.addEventListener("resize", function() {

            window.setTimeout(_this.gameResize.bind(_this), 400);
        })
    };

    /**
     * 游戏大小改变
     */
    HtgPlatformSdk.prototype.gameResize = function() {

        if(this.safeSizeData)
        {
            var data = this.safeSizeData;

            this.updateGameScreen(data.top || 0, data.bottom || 0);
        }
    }

    /** 初始化SDK */
    HtgPlatformSdk.prototype.initOpenSDk = function() {
        this.htgSdk = window.hitalkOpenSDK || {};

        var server = this.getUrlParam("htgserver");

        if(server && server.indexOf("10.10.10.70") >= 0) 
        {
            this.sdk_inited = true;
            this.htgSdk = {};
            return;
        }
        
        if(typeof this.htgSdk.init == "function") {
            var _this = this;
            this.htgSdk.init(function(res) {
                if(res && res.retCode != 0) {
                    console.log("初始化失败!", res);
                    return;
				}
                _this.sdk_inited = true;
                if(typeof _this.loginCallback == "function") {
                    _this.loginGame(_this.loginCallback, _this.loginthisobj);
                }
            }, {gameId:107});
        }
    }

    /**
     * 游戏充值
     * @param payData 充值订单信息
     */
    HtgPlatformSdk.prototype.gamePay = function (payData, callBack, thisobj) {
        if(typeof this.htgSdk.gamePay == "function" )
        {  
            var _this = this;
            this.htgSdk.gamePay(payData, function(res) {
                if(res && res.retCode != 0) {
                    _this.showGameMsg(":فشلت عملية إعادة الشحن" + res.retCode);
                    return;
				}
                callBack && callBack.call(thisobj, res);
            });
        }
    };
    /**
     * 执行平台相关功能
     * @param action 功能类型，具体查看ExtraAction.ts
     * @param params 参数
     * @param callback 回调方法 
     * @param thisobj this指向
     */
    HtgPlatformSdk.prototype.gameExtraAction = function (action, params, callback, thisobj) {
        
        var _this = this;

        if(!_this.htgSdk || typeof _this.htgSdk.gameExtraAction != "function") {

            callback && callback.call(thisobj, {retCode:-1});

            return;
        };

        _this.htgSdk.gameExtraAction(action, params || {}, function(res) {
            
            callback && callback.call(thisobj, res);
        })
    };
    /**
     * 查询平台相关功能状态
     * @param action 功能类型，具体查看ExtraAction.ts
     */
    HtgPlatformSdk.prototype.searchExtraAction = function (action) {
        
        var _this = this;

        if(!_this.htgSdk || !_this.htgSdk.switchStatus) {

            return null;
        }

        //获取功能开关状态
        var status = _this.htgSdk.switchStatus;

        return status[action];
    };
    /** 
     * 打开url地址 
     * @param $url http地址
     */
    HtgPlatformSdk.prototype.openUrl = function ($url) {

        var _this = this;

        if(!$url || !_this.htgSdk || typeof _this.htgSdk.openUrl != "function") return;

        _this.htgSdk.openUrl({url:$url});
    };
    /**
     * 预览图片
     * @param $url 图片地址
     * @version miniGame
     */
    HtgPlatformSdk.prototype.previewImage = function ($url) {

    };
    /**
     * 小游戏名
     */
    HtgPlatformSdk.prototype.miniGameName = function () {
        return "";
    };
    /**
     * 小游戏初始化
     * @version miniGame
     */
    HtgPlatformSdk.prototype.miniGameInit = function (callback) {
        
    };
    /**
     * 小游戏背景图片
     * @version miniGame
     */
    HtgPlatformSdk.prototype.getMiniGameBack = function () {
        return null;
    };
    /**
     * 获取y轴偏移量
     */
    HtgPlatformSdk.prototype.getMenuButtonOffY = function(stageHeight, callback) {
        
        var _this = this;

        this.gameExtraAction("getSafeInset", null, function(res) {
            
            if(res && res.retCode == 0)
            {
                var data = _this.safeSizeData = res.data;

                data && _this.updateGameScreen(data.top || 0, data.bottom || 0);
            }

        }, null);
    };

    /**
     * 更新游戏显示区域
     */
    HtgPlatformSdk.prototype.updateGameScreen = function(top, bottom) {

        var div = document.getElementById("egret-player");

        var style = div && div.style;

        if(!style) return;

        if(top > 0 || bottom > 0)
        {
            var game_rect = document.getElementById("game_rect");

            var rect = game_rect && game_rect.getBoundingClientRect();

            if(!rect) return;

            if(rect.width > rect.height)
            {
                //横屏
                style.left = top + "px";

                style.width = (rect.width - top - bottom) + "px";

                style.top = "0px";

                style.height = "100%";

                this.top_div = this.createDiv(this.top_div, top + "px", "100%", 0, 0, 0, 0, true);

                this.bottom_div = this.createDiv(this.bottom_div, bottom + "px", "100%", 0, 0, "0px", 0, false);
            }
            else
            {
                //竖屏
                style.top = top + "px";
                
                style.height = (rect.height - top - bottom) + "px";

                style.left = "0px";

                style.width = "100%";

                this.top_div = this.createDiv(this.top_div, "100%", top + "px", 0, 0, 0, 0, true);

                this.bottom_div = this.createDiv(this.bottom_div, "100%", bottom + "px", 0, 0, 0, "0px", false);
            }
        }
        else
        {
            this.top_div && this.top_div.parentNode && this.top_div.parentNode.removeChild(this.top_div);

            this.bottom_div && this.bottom_div.parentNode && this.bottom_div.parentNode.removeChild(this.bottom_div);

            style.top = "0px";

            style.left = "0px";

            style.width = "100%";

            style.height = "100%";
        }

        egret.updateAllScreens();
    }

    /**
     * 创建一个div层
     */
    HtgPlatformSdk.prototype.createDiv = function(div, width, height, left, top, right, bottom, istop) {

        var newdiv = div || document.createElement("div");

        var style = newdiv.style;

        style.position = "absolute";

        style.width = width;

        style.height = height;

        left && (style.left = left);

        top && (style.top = top);

        right && (style.right = right);

        bottom && (style.bottom = bottom);

        style.margin = "auto";

        style.overflow = "hidden";

        style.pointerEvents = "none";

        if(istop)
        {
            style.background = "url(./resource/loading/full_back_top.png)";
        }
        else
        {
            style.background = "url(./resource/loading/full_back_bottom.png)";
        }

        var body = document.body;

        body && body.appendChild(newdiv);

        return newdiv;
    }

    /**
     * 是否为https请求
     */
    HtgPlatformSdk.prototype.isHttps = function () {
        return window.location.protocol == "https:";
    };
    /**
     * 获取当前操作系统
     */
    HtgPlatformSdk.prototype.getSysPlatform = function () {
        return null;
    };
    /**
     * 比较路由版本号
     * @version miniGame
     * @param s_route 服务器路由版本号
     */
    HtgPlatformSdk.prototype.compareRouteVer = function (s_route) {
    };
    /**
     * 获取资源请求路径
     * @version miniGame
     */
    HtgPlatformSdk.prototype.getResPath = function () {
        return "";
    };
    /**
     * 设置分享初始数据
     * @param callback 获取分享数据回调方法
     */
    HtgPlatformSdk.prototype.setOnShareHandler = function (callback) {
    };
    /**
     * 注册小游戏onShow事件
     * @param callback onShow事件回调方法
     * @version miniGame
     */
    HtgPlatformSdk.prototype.registerMiniOnShow = function (callback) {
    };
    /**
     * 获取小游戏启动项参数
     * @version miniGame
     */
    HtgPlatformSdk.prototype.getMiniLaunchOpt = function () {
        return null;
    };
    /**
     * 主动拉起小游戏分享
     * @param shareData 分享数据
     * @param callback 分享结果回调方法
     * @version miniGame
     */
    HtgPlatformSdk.prototype.miniShareGame = function (shareData, callback) {
    };
    /**
     * 消息合法验证
     * @param msg 需要验证的数据
     * @param callback 验证结果回调
     * @version miniGame
     */
    HtgPlatformSdk.prototype.msgSecCheck = function (msg, callback) {
    };
    /**
     * 加载模板
     * @param param 模板参数
     * @version miniGame
     */
    HtgPlatformSdk.prototype.loadTemplate = function (param) {
    };
    /**
     * 清除模板缓存
     * @version miniGame
     */
    HtgPlatformSdk.prototype.clearTempCache = function () {
    };
    /**
     * 获取小游戏场景值
     * @version miniGame
     */
    HtgPlatformSdk.prototype.getminiScene = function () {
        return "";
    };
    /**
     * 游戏退出
     */
    HtgPlatformSdk.prototype.gameLogout = function () {
        window.location.reload();
    };
    /**
     * 跳转到手Q小游戏
     */
    HtgPlatformSdk.prototype.gotoQQMiniGame = function () {
        alert("跳转手Q小游戏");
    };
    /**
     * 初始化url地址参数
     */
    HtgPlatformSdk.prototype.initURLParam = function () {
        //获取url中"?"符后的字串
        var search = window.location.search;
        if (search) {
            search = search.substr(1);
            var arr = search.split("&");
            var length_1 = arr.length;
            var temp = void 0;
            var paramArr = void 0;
            for (var i = 0; i < length_1; i++) {
                temp = arr[i];
                if (temp.indexOf("=") == -1)
                    continue;
                paramArr = temp.split("=");
                this.urlParam[paramArr[0]] = decodeURIComponent(paramArr[1]);
            }
        }
    };
    /**
     * 根据名字获取参数值
     * @param name url参数key
     * @return url参数value
     */
    HtgPlatformSdk.prototype.getUrlParam = function (name) {
        return this.urlParam[name] || "";
    };
    /**
     * 获取url参数对象
     */
    HtgPlatformSdk.prototype.getAllURLParam = function () {
        return this.urlParam;
    };
    /**
     * 获取登录服地址
     */
    HtgPlatformSdk.prototype.getLoginServer = function () {
        // var _url = this.getUrlParam("htgserver");
        // if (_url) return _url;
        var htgConfig = window["htgConfig"] || {};
        return htgConfig.loginServer || "";
    };
    /**
     * 获取模板文件地址
     */
    HtgPlatformSdk.prototype.getTempUrl = function () {
        // var _url = this.getUrlParam("htgtemp");
        // if (_url) return _url;
        var htgConfig = window["htgConfig"] || {};
        return htgConfig.tempurl || "";
    };
    /**
     * 获取web资源版本号
     */
    HtgPlatformSdk.prototype.getWebVer = function () {
        var htgInitSdk = window.htgInitSdk;
        return (htgInitSdk && htgInitSdk.webVer) || "";
    };
    /**
     * 获取模板版本号
     */
    HtgPlatformSdk.prototype.getTempVer = function () {
        var htgInitSdk = window.htgInitSdk;
        return (htgInitSdk && htgInitSdk.tempVer) || "";
    };
    /**
     * 隐藏loadingDiv
     */
    HtgPlatformSdk.prototype.hideLoadingDiv = function () {
        var htgInitSdk = window.htgInitSdk;
        if(htgInitSdk && typeof htgInitSdk.hideLoadingDiv == "function")
        {
            htgInitSdk.hideLoadingDiv();
        }
    };
    /**
     * 加载游戏js文件
     * @param progCall 加载进度通知回调方法
     * @param overCall 加载结束回调方法
     */
    HtgPlatformSdk.prototype.loadGameScript = function (progCall, overCall) {
        var htgInitSdk = window.htgInitSdk;
        if(htgInitSdk && typeof htgInitSdk.loadGameScript == "function")
        {
            htgInitSdk.loadGameScript(progCall, overCall);
        }
    };
    /** 获取功能开关 */
    HtgPlatformSdk.prototype.getSwitchStatus = function () {
        return this.htgSdk.switchStatus || {};
    };
    /** 登录 */
    HtgPlatformSdk.prototype.loginGame = function (callBack, thisobj) {

        if(!this.sdk_inited) {
            this.loginCallback = callBack;
            this.loginthisobj = thisobj;
            return;
        }

        if(typeof this.htgSdk.login == "function") {
            var _this = this;
            this.htgSdk.login(function(res) {
                if(res && res.retCode != 0) {
                    _this.showGameMsg(res.retMsg);
                    return;
                }
                callBack && callBack.call(thisobj, res);
            });
        }
    };

    /** 获取支付功能开关 */
    HtgPlatformSdk.prototype.isOpenCharge = function (callBack, thisobj) {
        if(typeof this.htgSdk.isGamePay == "function" ) {
            this.htgSdk.isGamePay({}, function(res) {
                callBack && callBack.call(thisobj, res)
            });
        }
    };

    /** 
     * 游戏上报
     * @param type: 1(注册上报)，2(创角上报)，3(登录上报)，4(升级上报)，5(vip上报)
     */
    HtgPlatformSdk.prototype.gameReport = function (type, paramData, callBack, thisobj) {
        if(typeof this.htgSdk.gameReport == "function" ) {
            this.htgSdk.gameReport(type, paramData, function(res) {
                callBack && callBack.call(thisobj, res)
            });
        }
    };
    /**
     * 注册游戏内消息提示方法
     */
    HtgPlatformSdk.prototype.registerMsgPanel = function(showfunc, thisobj) {
        this.gameMsgFun = showfunc;
        this.gameMsgObj = thisobj;
    }
    /**
     * 游戏内提示消息
     * @param msg 提示内容
     */
    HtgPlatformSdk.prototype.showGameMsg = function(msg) {
        if(typeof this.gameMsgFun == "function") {
            this.gameMsgFun.call(this.gameMsgObj, msg, null, 1);
        }
    }
    /**
     * 游戏入口类型
     * @return "web"|"native"|other
     */
    HtgPlatformSdk.prototype.entType = function() {
        return window.HTG_ENT_TYPE || "web";
    }
    /**
     * 更新游戏声音状态(微端包控制)
     * @param isopen 是否开启声音
     */
    HtgPlatformSdk.prototype.updateSoundState = function(isopen) {

         if(typeof App != "undefined" && typeof App.sound != "undefined")
         {
             if(typeof App.sound.miniSoundOpen == "function")
             {
                App.sound.miniSoundOpen = (isopen == "true");
             }
         }
    }

    /**网络请求 */
    HtgPlatformSdk.prototype.request = function (params, callback, thisobj) {
        var url = params.url;
        var requestType = params.requestType || "GET";
        var xhr = new XMLHttpRequest();
        var postData;
        xhr.open(requestType, url, true);
        // xhr.setRequestHeader('Content-type', 'application/json');
        // xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        // xhr.setRequestHeader('Access-Control-Allow-Methods', 'POST, PUT, GET, OPTIONS, DELETE');
        // xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
        // xhr.setRequestHeader('Access-Control-Expose-Headers',"*");
        // xhr.addEventListener('load', function () {
        //     if (callback) {
        //         callback.call(thisobj, JSON.parse(xhr.response));
        //     }
        // });
        // xhr.send(null);
        if (requestType == "POST") {
            xhr.setRequestHeader("Content-type", "application/json")
        }
        var __mainfestComplete = function () {
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = null;
            }
        }
        xhr.onreadystatechange = __mainfestComplete;
        if (params.data) {
            //console.log('ruquert发送的参数:' + JSON.stringify(params));
            postData = JSON.stringify(params.data);
            xhr.send(postData);
        }
        else {
            xhr.send(null);
        }
        // xhr.send(null);
    };

    /**游戏上报 游戏数据库*/
    HtgPlatformSdk.prototype.gameReport2 = function (url, params) {
        var _url = url;
        if (!params) return;
        for (let key in params) {
            _url += "&" + key + "=" + params[key]
        }
        _url += "&place=内网/混服";
        var info = {
            url: _url,
            requestType: "GET"
        }
        this.request(info, null, null);
    }

    /**
     * 事件打点上报
     */
    HtgPlatformSdk.prototype.eventReport = function (paramData) {
        if (!paramData) return;


        if(LoadingConst.DEBUG) console.log("越南事件打点:" + JSON.stringify(paramData));
        htgPlatSdk.gameReport(LoadingConst.POINT_REPORT, { pointtype: "ISSUE", pointid: 0, pointnum: 0 , eventName: paramData.name, key:paramData.key,value:paramData.value});
    }

    /**
   * 打开FB分享接口
   */
    HtgPlatformSdk.prototype.openFbShare = function () {
    }

    /**
    * 打开FB点赞接口
    */
    HtgPlatformSdk.prototype.openDianzan = function () {
    }

    /**
    * 打开google 评分接口
    */
    HtgPlatformSdk.prototype.openGooglePlayInappReview = function () {
    }

        /**
    * 打开问卷调查
    */
    HtgPlatformSdk.prototype.openSurveyView = function () {

        }

    /**post 请求上报 (目前是错误上报)*/
    HtgPlatformSdk.prototype.errorReport = function (requrl, params) {
        var _url = requrl;
        var info = {
            data: params,
            url: _url,
            requestType: "POST"
        }
        this.request(info, null, null);
    }

    /**原生包内存 */
    HtgPlatformSdk.prototype.memoryToGame = function (callback, thisobj) {
    };

    HtgPlatformSdk.prototype.sentGetErrorReport = function (requrl, params) {
    }

    return HtgPlatformSdk;
}());
/**
 * 游戏对接平台sdk对象
 */
window.htgPlatSdk = new HtgPlatformSdk();
htgPlatSdk.setup();

window.updateSoundState = function(isopen) 
{   
    if(typeof window.htgPlatSdk != "undefined" && typeof window.htgPlatSdk.updateSoundState == "function")
    {
        window.htgPlatSdk.updateSoundState(isopen);
    }
}