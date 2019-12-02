import '../demo/libs/common'
import '../demo/js/jquery.min'
import Swiper from  'swiper'
class actionsFun {
    [x: string]: any;
    constructor() {
        this.groupBuyingSwiper = null; // 团购互动点的swiper
        this.groupBuyingData = null; // 团购互动点，接口返回的数据
        this._mainfunObj = null; // 互动项目中主要逻辑所在对象
        this.pointId = 0;
        this.watermarkId = getUrlParam('watermarkId');
        this.lotteryCli = false; // 九宫格点击判断
        this.dataArr = []; // 九宫格奖品列表
        this.lotteryCanDrawCount = 0;
        this.overInd = 0;
        this.publicLotteryLabel = ''; // 九宫格label
        this.msg = ''; // 互动点的附加数据
        this.activityId = '';
        this.channelActivityId = '';
        this.programId = '';
        this.resourceId = null;
        this.enterpriseId = '';
        this.redPaperLabel = 'ms_red_envelope_rain';
        this.alertMsgTimer = null;
        this.lotteryLuck = { // 九宫格配置项
            index: 0, //当前转动到哪个位置，起点位置
            count: 0, //总共有多少个位置
            timer: 0, //setTimeout的ID，用clearTimeout清除
            speed: 20, //初始转动速度
            times: 0, //转动次数
            cycle: 50, //转动基本次数：即至少需要转动多少次再进入抽奖环节
            prize: -1, //中奖位置
            init: (id) => {
                if ($("#" + id).find(".luck-unit").length > 0) {
                    this.lotteryLuck.obj = $("#" + id);
                    this.lotteryLuck.count = $("#" + id).find(".luck-unit").length;
                    $("#" + id).find(".luck-unit-" + this.lotteryLuck.index).addClass("active");
                };
            },
            roll: () => {
                let index = this.lotteryLuck.index;
                let count = this.lotteryLuck.count;
                let luck = this.lotteryLuck.obj;
                $(luck).find(".luck-unit-" + index).removeClass("active");
                index += 1;
                if (index > count - 1) {
                    index = 0;
                };
                $(luck).find(".luck-unit-" + index).addClass("active");
                this.lotteryLuck.index = index;
                return false;
            }
        };
        this.timerOfRE = ''; // 红包计时器
        this.timerOfCountDown = '';  // 红包倒计时定时器
        this.wid = parseInt($(window).width()) - 55; // 红包参数,利用window宽度调整红包位置
        this.numsOfHb = 0; // 红包参数
    }
    // 把本方法添加到关闭遮罩层的方法中，需要在关闭后执行的函数全部写到这里
    publicFuncAfterClose() {
        // 关闭防止滚动穿透
        if (this._mainfunObj && typeof this._mainfunObj.stopBodyScroll == 'function') {
            this._mainfunObj.stopBodyScroll(true)
        }
    };
    // 在显示公共互动点前先调用本方法
    publicFuncBeforeShow() {
        // 开启防止滚动穿透
        if (this._mainfunObj && typeof this._mainfunObj.stopBodyScroll == 'function') {
            this._mainfunObj.stopBodyScroll(false)
        }
    };
    /**
     * 区分className
     *
     * @param String className
     * @param String token
     * @param Object dataObj 把轮询接口响应体中的data传过来
     * @param Object mainfunObj 互动index.js中的实例，用于调用对应函数
     * @memberof actionsFun
     */
    selectClassName(className, token, dataObj, mainfunObj) {
        this.removeAction()
        this._mainfunObj = mainfunObj
        switch (className) {
            // 通用九宫格
            case "publicLottery":
                this.publicFuncBeforeShow()
                actionsfun.publicLotteryDom('body', function () {
                    actionsfun.publicLotteryData(token)
                })
                break;
            // 通用红包
            case "redEnvelope":
                this.publicFuncBeforeShow()
                this.initRedEnvelope(dataObj, token)
                break;
            // 通用结束页
            case "publicFinishPage":
                this.publicFuncBeforeShow()
                this.initPublicFinishPop(dataObj)
                break;
            default:
                break;
        }
    }
    removeAction() { // 移除动态创建的互动点,在出现新互动点前执行
        this.removePublicLottery() // 删除新九宫格
        clearTimeout(actionsfun.timerOfRE) // 清除红包雨定时器
        // 九宫格抽奖
        let removeArr = ['.lotteryPage', '.redPaperPage', '.groupBuyingWrap', '.publicLottery']
        removeArr.forEach(function (val, ind) {
            $(val).remove()
        })
        this.removeRedEnvelopePageRelatedDoms() // 删除拆红包互动点
        this.removePublicFinishPopDom()
    }
    // 红包倒计时动画
    startAnimationOfRE() {
        $(".start_box").show();
        let num = 3; // 倒计时时间
        let startA = function () {
            if (num > 0) {
                clearTimeout(actionsfun.timerOfCountDown)  // 清除上一个计时器
                $(".start_box span").html(num);
                $(".start_box p").html('红包即将来袭');
                num--;
                actionsfun.timerOfCountDown = setTimeout(startA, 1000); // 递归调用,写在这里保证递归能停止
            } else {
                clearTimeout(actionsfun.timerOfCountDown);  // 清除上一个计时器
                $(".start_box").hide();
            }
        }
        startA(); // 开始倒计时，内有递归调用
    }
    // 红包循环随机数的方法
    randomNumForRE(startNum, endNum) {
        return parseInt(Math.random() * ((endNum + 1) - startNum) + startNum);
    }
    // 向页面中添加红包
    addRE() {
        let ranImg = 2; // 用来切换图片用。
        let ranLeft = actionsfun.randomNumForRE(0, actionsfun.wid); // 用来设置红包与屏幕左侧的间距
        //let ranRotate =randomNumForRE(-45,45); // 设置红包的rotate值。
        let ranRotate = 0; // 设置红包的rotate值。
        actionsfun.numsOfHb++;
        let redpackHTML = "<li class='li" + actionsfun.numsOfHb + "'>" +
            "<img src='./imgs/hb_" + ranImg + ".png'></a></li>";
        $(".redpack_box").append(redpackHTML);
        $(".li" + actionsfun.numsOfHb).css("left", ranLeft);
        $(".li" + actionsfun.numsOfHb + " img").css({
            "width": 100 / 46.875 + "rem",
            "transform": "rotate(" + ranRotate + "deg)",
            "-moz-transform": "rotate(" + ranRotate + "deg)",
            /* Firefox */
            "-webkit-transform": "rotate(" + ranRotate + "deg)"
            /* Safari 和 Chrome */
        });
        $(".li" + actionsfun.numsOfHb).animate({ "top": '110%' }, 5000, function () {
            //删除掉落的红包
            $(this).remove()  // 这个this就是要选当前的这个红包节点，没问题
        });
        // 丢红包的间隔时间
        clearTimeout(actionsfun.timerOfRE);  // 清除上一个定时器，防止越跑越快
        actionsfun.timerOfRE = setTimeout(actionsfun.addRE, 300);
    }
    // 获取发红包接口信息，并更新红包内容
    getRedEnvelopeInfo(token:string, callback?:any) {
        $(".redPaperPage").off('click', 'li'); // 防止二次点击
        actionsfun.getPrizes(actionsfun.redPaperLabel, token, function (msg) {
            console.log(msg)
            var awardType = ''
            if (msg.data.length) { // 有奖品
                if (msg.data[0].awardWayType == 4) { // 已领取
                    if (msg.data[0].amount > 0) {
                        $('.pop_con h3').html("您已领取" + msg.data[0].awardName)
                        $('.pop_money').html(msg.data[0].bonus)
                        $('.cashBG img').attr('src', msg.data[0].awardPic)
                        $(".pop_con p").html(msg.data[0].awardName)
                        $(".pop_box").fadeIn()
                        $(".pop_con").fadeIn()
                    } else {
                        $(".pop_box").fadeIn()
                        $(".pop_none").fadeIn().css('display', 'flex')
                    }
                } else if (msg.data[0].awardWayType == 5) { // 未到时间
                    $(".pop_box").fadeIn()
                    $(".pop_nomal").fadeIn().css('display', 'flex')
                } else { // 未领取
                    $(".pop_box").fadeIn()
                    // awardType  关联的类型0卡券1道具2金币3现金
                    if (msg.data[0].awardType == 3) {
                        awardType = '元现金'
                        if (msg.data[0].amount > 0) {
                            $(".pop_con").fadeIn()
                            $(".pop_con p").html(msg.data[0].awardName)
                            $('.pop_money').html(msg.data[0].amount)
                        } else {
                            $(".pop_box").fadeIn()
                            $(".pop_none").fadeIn().css('display', 'flex')
                        }
                    } else if (msg.data[0].awardType == 2) {
                        awardType = '金币'
                        $(".pop_gold").fadeIn()
                        $('.pop_gold_num').html(msg.data[0].amount)
                    } else {
                        $(".pop_box").fadeIn()
                        $(".pop_none").fadeIn().css('display', 'flex')
                    }
                }
            } else { // 没抽中
                $(".pop_box").fadeIn()
                $(".pop_none").fadeIn().css('display', 'flex')
            }

        })
        // getData('/food/getHongbao', {
        //     token:token,
        //     data: {
        //         pointId: this.pointId,  // pointId
        //         watermarkId: this.watermarkId,  // 水印id
        //         sendType:sendType   // 0代表美食 1闽南语 2泉城搜go 3新闻相拍报
        //     }
        // }, function (msg) {  // 更新红包内金额信息
        //     if(msg.success){
        //         // 0领取成功 1领完了 3已经领过 4手气不好没有领到 5不在当前红包发奖的时间段
        //         if (msg.data.state == 1 || msg.data.state == 4) {
        //             $(".pop_box").fadeIn()
        //             $(".pop_none").fadeIn().css('display','flex')
        //         } else if (msg.data.state == 0) {
        //             $(".pop_box").fadeIn()
        //             // 金币为4 现金是3
        //             if(msg.data.awards[0].wealtypeid == 3){ 
        //                 $(".pop_con").fadeIn()
        //                 $('.pop_money').html(msg.data.awards[0].bonus)
        //             }else if(msg.data.awards[0].wealtypeid == 4){
        //                 $(".pop_gold").fadeIn()
        //             }
        //         } else if(msg.data.state == 3){
        //             if(msg.data.awards.length){
        //                 $('.pop_con h3').html("您已领取"+msg.data.awards[0].wealname)
        //                 $('.pop_money').html(msg.data.awards[0].bonus)
        //                 $('.cashBG img').attr('src',msg.data.awards[0].weallogourl)
        //                 $(".pop_box").fadeIn()
        //                 $(".pop_con").fadeIn()
        //             }else{
        //                 $(".pop_box").fadeIn()
        //                 $(".pop_none").fadeIn().css('display','flex')
        //             }
        //         }else if(msg.data.state == 5){
        //             $(".pop_box").fadeIn()
        //             $(".pop_nomal").fadeIn().css('display','flex')
        //         }else{
        //             $(".pop_box").fadeIn()
        //             $(".pop_none").fadeIn().css('display','flex')
        //         }
        //     }else{
        //         $(".pop_box").fadeIn()
        //         $(".pop_none").fadeIn().css('display','flex')
        //     }
        // })
        callback && callback()
    }
    // 弹出红包
    showRedEnvelope() {
        $('#missileImg').fadeOut('fast', function () {
            $('#missileImg').attr('src', null)
        })
        $('.wrap2').fadeIn('fast')
        this.startAnimationOfRE() // 开始红包动画
        setTimeout(this.addRE, 3000); // 开始丢红包的函数，显示倒计时，注意时间比startAnimationOfRE里面的少1秒
    }
    // 红包雨点击事件
    redPaperCli(sendType:any, token:string) {
        // 绑定红包点击事件
        $(".redPaperPage").on('click', 'li', function () {
            clearTimeout(actionsfun.timerOfRE);
            console.log('click once!');
            actionsfun.getRedEnvelopeInfo(token)
        });
        $('.closeInRE').on('click', function () {
            $(this).parent().fadeOut()
            $('.pop_box').parent().fadeOut()
            $('.redPaperPage').fadeOut(function () {
                $('.redPaperPage').remove()
            })
        })
    }
    redPaperFun(sendType:any, token:any, msgData:any) {  // 调用红包雨
        actionsfun.removeAction()
        let pop_nomal = "您来早啦，红包将在今天晚上19:00~20:00黄金时间档为您呈现，锁定泉州4套，泉城搜Go，我爱闽南语，泉州美食，新闻相拍报节目(即将上线)，快来试试你的手气有多好吧！";
        let pop_none = "您这次什么都没有抢到诶，再接再厉哦！参与本时段后面的节目互动或明天19:00~20:00泉州4套，均有机会获得现金红包";
        if (msgData.pop_nomal) {
            pop_nomal = msgData.pop_nomal;
        }
        if (msgData.pop_none) {
            pop_none = msgData.pop_none;
        }
        let domStr = `<div class="redPaperPage"><div class="start_box"><p></p><span></span></div><ul class="redpack_box"></ul><div class="pop_box"><div class="pop_con"><h3>恭喜您获得<b class="pop_money"></b>元红包!</h3><div class="cashBG"><img src="./imgs/RE_cash.png" alt=""></div><p>现金<b class="pop_money"></b>元</p><img src="./imgs/RE_close.png"  alt="" class="closeInRE"></div><div class="pop_gold"><h3>恭喜您获得<b class='pop_gold_num'>888</b>枚金币，金币已经自动存入您的账户中</h3><div class="cashBG"><img src="./imgs/gold.png" alt=""></div><p>金币<b class='pop_gold_num'>888</b>枚</p><img src="./imgs/RE_close.png"  alt="" class="closeInRE"></div><div class="pop_none"><h4>${pop_none}</h4><img src="./imgs/RE_close.png"  alt="" class="closeInRE"></div><div class="pop_nomal"><h4>${pop_nomal}</h4><img src="./imgs/RE_close.png"  alt="" class="closeInRE"></div></div></div>`;
        $('body').append(domStr)
        actionsfun.showRedEnvelope()
        actionsfun.redPaperCli(sendType, token)
        $('body').css({ 'overflow': 'hidden' })
        $('.redPaperPage').fadeIn()
    }
    getPrizes(label:any, token:any, callback:any) { // 直接领奖
        getData('/main/poolPoint/getAwardToken', { // 获取令牌
            data: {
                activityId: actionsfun.activityId,
                channelActivityId: actionsfun.channelActivityId,
                pointId: actionsfun.pointId,
                programId: actionsfun.programId,
                resourceId: null,
                tokenKey: actionsfun.pointId + ':' + label
            },
            token: token
        }, function (msg) {
            console.log(msg)
            if (msg.success) {
                getData('/main/poolPoint/getAndSendPrizes', { // 发放奖品
                    data: {
                        activityId: actionsfun.activityId,
                        channelActivityId: actionsfun.channelActivityId,
                        pointId: actionsfun.pointId,
                        programId: actionsfun.programId,
                        resourceId: null,
                        enterpriseId: actionsfun.enterpriseId,
                        token: msg.data.token,
                        tokenKey: msg.data.tokenKey
                    },
                    token: token
                }, function (msg) {
                    console.log(msg)
                    if (msg.success) {
                        callback && callback(msg)
                    }
                })
            }
        })
    }

    // 砸金蛋
    initSmashingEggs(eggsText = '金蛋好礼送不停', token) {
        $('body').append("<div class=\"smashingEggsPage\">\n            <img src=\"./imgs/whiteClose.png\" class=\"whiteClose\">\n            <div class=\"smashingEggsTitle\">\n          <p>" + eggsText + "</p>  </div>\n            <img src=\"./imgs/eggsImg.png\" class=\"eggsImg\">\n            <img src=\"./imgs/hammerImg.png\" class=\"hammer\">\n            <img src=\"./imgs/eggsOrnamentImg.png\" class=\"eggsOrnamentImg\">\n            <img class=\"eggsOrnamentGif\">\n            <img src=\"./imgs/smashingEggsBtn.png\" class=\"smashingEggsBtn\">\n            <div class=\"smashingEggsWrap\">\n                <div class=\"smashingEggsAlert\">\n         <img src=\"./imgs/eggsTopImg.png\" class=\"eggsTopImg\">           <h1>恭喜您中奖啦！</h1>\n                    <img src=\"\" class=\"ticket\">\n                    <p>领取后可在「我的」-「我的奖品」里查看</p>\n                    <button class='eggsConfirm'>一键领取</button>\n                </div>\n            </div>\n        <div class='alertMsg'></div></div>")
        let firstCli = 1;
        let timer = 0;
        let eggsTimer = null;
        $('.eggsImg ,.hammer,.smashingEggsBtn').on('click', function () {
            if (firstCli) {
                firstCli = 0
                $('.hammer').toggleClass('hammerTransition')
                actionsfun.getPrizes('jz_golden_eggs', token, function (msg) {
                    $('.ticket').attr('src', msg.data[0].awardPic)
                    setTimeout(() => {
                        $('.eggsImg').hide()
                        $('.eggsOrnamentGif').attr('src', './imgs/eggsGif.gif').show()
                        setTimeout(() => {
                            $('.eggsImg').show()
                            $('.eggsOrnamentGif').attr('src', '').hide()
                            $('.smashingEggsWrap').fadeIn().css({ 'display': 'flex' })
                        }, 2000)
                    }, 1700);
                })
            }
        })
        $('.whiteClose').on('click', function () {
            actionsfun.removeSmashingEggs()
        })
        $('.eggsConfirm').on('click', function () {
            $(".alertMsg").html('恭喜您，领取成功！').slideDown()
            clearTimeout(actionsfun.alertMsgTimer)
            actionsfun.alertMsgTimer = setTimeout(function () {
                $(".alertMsg").slideUp();
                actionsfun.removeSmashingEggs()
            }, 2000);
        })
    }
    removeSmashingEggs() { // 移除砸金蛋dom
        $('.smashingEggsPage').fadeOut(function () {
            $('.smashingEggsPage').remove()
        })
    }
    // 使用本方法，需要swipper，需在调用本方法前载入
    // 调用团购互动点
    // 背景图为bgImg， 标题图为titleImg,传入相对路径即可
    // groupId为团购id，调接口获取团购信息
    groupBuyingFun(bgImg, titleImg, groupId, token, callback) {
        this.removeAction()
        getData('/shop/fightGroupGoods/queryGroupProducts', {
            token: token,
            data: groupId
        }, function (msg) {  // 更新红包内金额信息
            if (msg.success) {
                // 保存返回的数据
                actionsfun.groupBuyingData = msg.data
                // 插入dom节点
                actionsfun.groupBuyingAddDom(bgImg, titleImg, msg.data)
                // 启动轮播图
                actionsfun.groupBuyingInitSwiper()
                // 插入轮播图数据
                actionsfun.injectSwiperPics(msg.data.goodsPic.split(','))
                // 注册点击事件
                actionsfun.groupBuyingAddClickEvent()
                $('.groupBuyingWrap').fadeIn()
                callback && callback()
            }
        })
    };
    groupBuyingAddDom(bgImg, titleImg, data) {
        // 获取拼团的domStr
        let getDomStr = (assemblePeopleList) => {
            let tempDomStr = ''
            for (let indexOut = 0; indexOut < assemblePeopleList.length; indexOut++) {
                const item = assemblePeopleList[indexOut];
                tempDomStr += `<div class="groupBuying-publicGroupBox"><div class="groupBuying-titleBox"><span class="left">${item.peopleNum}人团</span><span class="right">已有${item.number}人正在拼团</span></div>`
                for (let index = 0; index < item.assembleGoodsList.length; index++) {
                    const itemInner = item.assembleGoodsList[index];
                    tempDomStr += `<div class="groupBuying-lowerBox" data-outIndex="${indexOut}" data-innerindex="${index}"><div class="left"><img src="${itemInner.goods.goodsSamllPic}"alt=" "></div><div class="middle"><p class="goodsName">${itemInner.goods.goodsName}</p><p class="originalPrice">原价：${itemInner.goods.goodsOriginalPrice}</p><p class="groupPrice">拼团价：${itemInner.goods.goodsMoney}</p></div><div class="right"><button id="joinNow"  data-outIndex="${indexOut}" data-innerindex="${index}">立即拼团</button></div></div>`
                }
                tempDomStr += '</div>'
            }
            return tempDomStr
        }

        const priceArea = data.priceArea // 价格区间
        const fightContent = data.fightContent // 拼团介绍
        const endDomStr = '</div><div style="height: 0.6rem"></div></div></div>'
        let domStr = `<div class="groupBuyingWrap"><div class="groupBuyingBgLayer"style="background-image: url('${bgImg}')"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAflBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////vroaSAAAAKXRSTlMA+WfmX1SFRR5aB7GoTBjHdTom7PKgbjcu087ZuIt6En8O3j8EwpW+MgpFgM0AAAJESURBVEjHhVWLurIgEIRQ1PBWXsrUY3b7z7z/C/5SRxEhne8rc51dmd0hiIHObcWF5TmrmtaJyQb2jqCYgTa7boXeX5lkVSEvHafk4QUD8vZriifpl9RXEX/3BJBFdv4LgDgso78hgGJv0s8V0NxthU4CuBmFdgB25AsCAKnBz07kK443oNQCAFtteV8Bx9n9DXm8MaAb2GO6K4Az2YBPEU79B1yyCXdi7SmeY9CzjDP9W8o/oCcSfNLjAsGSHwHXz68YeMnrg0KohypDhZxJKpUTd2aKd1jI8QD8TLo/s01wmQ9Q67ev+BJPSY1lmpaRn6Z5Mt0SDuBLRq9ZjQKBWo+nTY+iHJRcFuYcld+XfLn8cPgURIcjlX/4pbFlEsKkKjPj5CtLK6SoCIVj8z+lkm+WqoeEgBg4ZAC1+CsCIzkcizVlwsGM35ENGkrzBXgjsL6hBrfxXfnlmDu/HkxbmHyp17W8gw9Dey0HF4/+cWFsRIFGNr3T9NZTP12A6qPOcCWdbr4DnfnhnOsPo/crEyS6kWZFz9AyQtw+RjjO+LpTgrmheoB/PBuqgjK0zAimHiGW1xbwxzabQwnGmKrcUzR/IZ5a/JPuRwVj4UgK3cRhpl+Abp9+DIm6yVBvJSSgndb+5LHKbwDteLoC1cqqugRotYjMyN1v/IgpvrYrC99Gjwsg9yxxAdDWN8KcAs0YNv9eELoz9Xs3pGvH67HAACZ4GXleVHLB3iWkN7+mXCtoqPhAX8fvj3jWLMtYnYgf86z8Dx7ORnuj/i4jAAAAAElFTkSuQmCC"alt=" "id="closeGroupBuying"><div style="height: 2.16rem"></div><img src="${titleImg}"alt=""class="groupBuyingTitle"><div class="groupBuyingContainer"><div class="groupBuying-swiper-container"><div class="swiper-wrapper"></div><div class="swiper-pagination"></div></div><div class="descBox"><p class="originalPrice">原价：${priceArea}</p><div class="desc">${fightContent}</div></div>`
        let goodsStr = getDomStr(data.assemblePeopleList)

        $('body').append(domStr + goodsStr + endDomStr)
    };
    groupBuyingInitSwiper(callback?:any) {
        actionsfun.groupBuyingSwiper = new Swiper('.groupBuying-swiper-container', {
            observer: true, //修改swiper自己或子元素时，自动初始化swiper
            observeParents: true, //修改swiper的父元素时，自动初始化swiper
            autoplay: true,
            pagination: {
                el: '.swiper-pagination',
            },
        });
        callback && callback()
    }
    // 拼团注册点击事件
    groupBuyingAddClickEvent() {
        // 立即购买
        const that = this
        $('.groupBuyingContainer').on('click', '#joinNow', function (e) {
            e.stopPropagation();
            let outindex = e.currentTarget.dataset.outindex
            let innerindex = e.currentTarget.dataset.innerindex
            // console.log(actionsfun.groupBuyingData.assemblePeopleList[outindex].assembleGoodsList[innerindex]);
            let goodsId = actionsfun.groupBuyingData.assemblePeopleList[outindex].assembleGoodsList[innerindex].goodsId;
            let goTo = SHOP_PRE_URL + 'app-mall/goodsDetail/index.html?id=' + goodsId + '&intoSubmit=1'
            jumpToWebView(encodeURIComponent(goTo))
        });
        // 跳转到详情页
        $('.groupBuyingContainer').on('click', '.groupBuying-lowerBox', function (e) {
            // console.log(e.currentTarget.dataset);
            e.stopPropagation();
            let outindex = e.currentTarget.dataset.outindex
            let innerindex = e.currentTarget.dataset.innerindex
            // console.log(actionsfun.groupBuyingData.assemblePeopleList[outindex].assembleGoodsList[innerindex]);
            let goodsId = actionsfun.groupBuyingData.assemblePeopleList[outindex].assembleGoodsList[innerindex].goodsId;
            let goTo = SHOP_PRE_URL + 'app-mall/goodsDetail/index.html?id=' + goodsId
            jumpToWebView(encodeURIComponent(goTo))
        });
        // 关闭按钮
        $('#closeGroupBuying').on('click', function () {
            $(this).parent().parent().fadeOut()
        });
    };
    // 往页面中动态插入轮播图图片
    // arr 为图片数组
    injectSwiperPics(arr) {
        var dom = $('.groupBuying-swiper-container .swiper-wrapper')
        $(dom).html("")
        arr.forEach(function (link) {
            var str = '<img src="' + link + '" alt="" class="swiper-slide">'
            $(dom).append(str)
        });
    };
    // 初始化开红包的相关操作，插入dom，注册点击事件等
    initRedEnvelope(dataObj, token) {
        // 设置 各项数据
        this.activityId = dataObj.activityId
        this.channelActivityId = dataObj.channelActivityId
        this.pointId = dataObj.point.id
        this.programId = dataObj.programId
        this.resourceId = dataObj.msg.redSkin.activityResource.id
        this.enterpriseId = dataObj.enterpriseId
        // 发奖第一步，获取token
        this.getRedEnvelopeAward(dataObj.msg.redSkin.activityResource.blockInfoList[0].awardLabelName, token) // 获得发奖token
        this.injectRedEnvelopeDoms(dataObj.msg.redSkin.activityResource.blockInfoList[0]) // 插入dom节点
        this.bindRedEnvelopeClick() // 注册点击事件
        // 显示页面,启动动画
        this.startAnimationOfRedEnvelope(dataObj.msg.redSkin.activityResource.blockInfoList[0].countdown)
    };

    /**
     * 开始倒计时，倒计时结束后，弹出打开红包页面
     * @param number countdownTime 倒计时时间
     */
    startAnimationOfRedEnvelope(countdownTime) {
        $('.openRedEnvelopeWrap .countdownPage').show();
        $('.openRedEnvelopeWrap').fadeIn();
        let dom = document.querySelector('.openRedEnvelopeWrap .countdownPage .countdownPageCountdownNumber')
        let intervalObj = null
        let startCountdown = () => {
            if (countdownTime > 1) {
                dom.innerHTML = --countdownTime
            } else {
                clearInterval(intervalObj)
                $('.openRedEnvelopeWrap .countdownPage').hide();
                $('.openRedEnvelopeWrap .redEnvelopeBeforeOpenPage').fadeIn('fast');
            }
        }
        intervalObj = setInterval(() => {
            startCountdown()
        }, 1000)
    };
    /**
     * 生成并插入开红包的dom节点
     * 插入在body下级
     * 预期获得参数包含:
     * 倒计时页：主标题、副标题、倒计时
     * 红包未打开页面：背景图（打开前）、拆字按钮图
     * 抢到红包页面：背景图（打开后）、收字按钮图、有红包文案
     * 未抢到红包页面：背景图（打开后，复用第二页）、确定按钮图、没抢到文案
     * 重复进入页面：背景图（打开后，复用第二页）、确定按钮图（复用第四页的）、重复领取文案
     */
    injectRedEnvelopeDoms(data) {
        let domStr = '<div class="openRedEnvelopeWrap">'
        // 倒计时页
        domStr += `<div class="countdownPage">
                        <div style="background-image: url('https://pic-oss.lingkehudong.com/images/publicInteractionPoint/countDownBg.png');"
                            alt="" class="countdownPageBgImgBox">
                            <p class="countdownPageMainTitle">${data.mainTitle}</p>
                            <p class="countdownPageSubTitle">${data.subtitle}</p>
                            <p class="countdownPageCountdownNumber">${data.countdown}</p>
                        </div>
                    </div>`
        // 红包未打开页面
        domStr += `<div class="redEnvelopeBeforeOpenPage">
                        <div style="background-image: url('${data.bgOpenPicUrl}');" alt="" class="redEnvelopeBeforeOpenPageBgImgBox">
                            <img src="https://pic-oss.lingkehudong.com/images/publicInteractionPoint/closeBtn.png" alt=""
                                class="redEnvelopeCloseBtn">
                            <img src="${data.splitButtonPicUrl}" alt=""
                                id="redEnvelopeBeforeOpenPageOpenBtn">
                        </div>
                    </div>`
        // 抢到红包页面，红包金额待调用发奖接口后插入。
        domStr += `<div class="redEnvelopeGetAwardPage">
                        <div style="background-image: url('${data.bgClosePicUrl}');" alt="" class="redEnvelopeGetAwardPageBgImgBox">
                            <img src="https://pic-oss.lingkehudong.com/images/publicInteractionPoint/closeBtn.png" alt=""
                                class="redEnvelopeCloseBtn">
                            <img src="${data.receptButtonPicUrl}" alt=""
                                id="redEnvelopeGetAwardPageReceiveBtn">
                            <span class="awardNumBox">0</span>
                            <p class="awardWords">${data.havaRedCopy}</p>
                        </div>
                    </div>`
        // 未抢到红包页面
        domStr += `<div class="redEnvelopeEmptyHandedPage">
                        <div style="background-image: url('${data.bgClosePicUrl}');" alt="" class="redEnvelopeEmptyHandedPageBgImgBox">
                            <img src="https://pic-oss.lingkehudong.com/images/publicInteractionPoint/closeBtn.png" alt=""
                                class="redEnvelopeCloseBtn">
                            <img src="${data.sureButtonPicUrl}" alt=""
                                id="redEnvelopeEmptyHandedPageConfirmBtn">
                            <span class="awardNumBox">0</span>
                            <p class="awardWords">${data.noHaveRedCopy}</p>
                        </div>
                    </div>`
        // 重复进入页面
        domStr += `<div class="redEnvelopeReEntryPage">
                        <div style="background-image: url('${data.bgClosePicUrl}');" alt="" class="redEnvelopeReEntryPageBgImgBox">
                            <img src="https://pic-oss.lingkehudong.com/images/publicInteractionPoint/closeBtn.png" alt=""
                                class="redEnvelopeCloseBtn">
                            <img src="${data.sureButtonPicUrl}" alt=""
                                id="redEnvelopeReEntryConfirmBtn">
                            <span class="awardWords1">已领取该红包</span>
                            <p class="awardWords2">${data.repeatAwardCopy}</p>
                        </div>
                    </div>`
        // 结束
        domStr += '</div>'
        // 倒计时页面
        $('body').append(domStr);
    };
    // 绑定点击事件
    bindRedEnvelopeClick() {
        // 收和叉按钮，都绑定closeRedEnvelopePage
        $('.openRedEnvelopeWrap .redEnvelopeCloseBtn').on('click', () => {
            this.closeRedEnvelopePage()
        });
        // 拆按钮，绑定handleOpenRedEnvelopeClick
        $('.openRedEnvelopeWrap #redEnvelopeBeforeOpenPageOpenBtn').on('click', () => {
            this.handleOpenRedEnvelopeClick()
        });
        // 收按钮、确定按钮，绑定closeRedEnvelopePage
        $('.openRedEnvelopeWrap #redEnvelopeGetAwardPageReceiveBtn, .openRedEnvelopeWrap #redEnvelopeReEntryConfirmBtn, .openRedEnvelopeWrap #redEnvelopeEmptyHandedPageConfirmBtn, .openRedEnvelopeWrap #redEnvelopeEmptyHandedPageConfirmBtn').on('click', () => {
            this.closeRedEnvelopePage()
        });
    };
    // 打开有红包页面
    showRedEnvelopeGetAwardPage(cashNum) {
        $('.openRedEnvelopeWrap .redEnvelopeGetAwardPage .awardNumBox').html(cashNum);
        $('.openRedEnvelopeWrap .redEnvelopeGetAwardPage').fadeIn('fast');
    };
    // 打开无红包页面
    showRedEnvelopeEmptyHandedPage() {
        $('.openRedEnvelopeWrap .redEnvelopeEmptyHandedPage').fadeIn('fast');
    };
    // 打开重复进入页面
    showRedEnvelopeReEntryPage() {
        $('.openRedEnvelopeWrap .redEnvelopeReEntryPage').fadeIn('fast');
    };
    // 关闭红包页面
    closeRedEnvelopePage(callback?:any) {
        $('.openRedEnvelopeWrap').fadeOut('fast', () => {
            this.publicFuncAfterClose()
            this.removeRedEnvelopePageRelatedDoms()
            callback && callback()
        });
    };
    // 移除‘开红包’相关dom节点
    removeRedEnvelopePageRelatedDoms() {
        var elem = document.querySelector('.openRedEnvelopeWrap');
        elem && elem.parentNode.removeChild(elem);
    };
    // 设置closeRedEnvelopePage执行后执行的函数
    setFuncAfterRedEnvelopePageClosed(afterfunc) {
        let oldFunc = this.closeRedEnvelopePage
        this.closeRedEnvelopePage = function () {
            let ret = oldFunc.apply(this, arguments)
            afterfunc.apply(this, arguments)
            return ret
        }
        console.log('set after success');
    };
    /**
     *  第一次调用获取发奖token,第二次调用发奖
     *  先调用/main/poolPoint/getAwardToken，获取awardToken.token，awardToken.tokenKey
     *  后调用/main/poolPoint/getAndSendPrizes
     */
    getRedEnvelopeAward(label?:any, token?:any) {
        let awardToken = null, awardTokenKey = null
        getDataPromise('/main/poolPoint/getAwardToken', {
            token: token,
            data: {
                activityId: actionsfun.activityId,
                channelActivityId: actionsfun.channelActivityId,
                pointId: actionsfun.pointId,
                programId: actionsfun.programId,
                resourceId: null,
                tokenKey: actionsfun.pointId + ':' + label
            }
        }).then((msg) => {
            if (msg.success) {
                awardToken = msg.data.token;
                awardTokenKey = msg.data.tokenKey;
                this.getRedEnvelopeAward = () => {
                    return getDataPromise('/main/poolPoint/getAndSendPrizes', {
                        token: token,
                        data: {
                            activityId: actionsfun.activityId,
                            channelActivityId: actionsfun.channelActivityId,
                            pointId: actionsfun.pointId,
                            programId: actionsfun.programId,
                            resourceId: null,
                            enterpriseId: actionsfun.enterpriseId,
                            token: awardToken,
                            tokenKey: awardTokenKey
                        }
                    })
                }
            }
        })
    };

    /**
     *  点击拆按钮执行的操作，调用发奖接口，获取数据后，判断奖品金额，填充金额到拆红包页面，
     *  根据金额选择开启有红包 or 无红包页面
     */
    handleOpenRedEnvelopeClick() {
        this.getRedEnvelopeAward().then((msg) => {
            console.log('发奖成功');
            console.log(msg);
            if (msg.success) {
                $('.openRedEnvelopeWrap .redEnvelopeBeforeOpenPage').hide();  // 隐藏未打开页面
                if (msg.data[0].awardWayType == 4) {
                    // 获取过的记录，重复进入
                    this.showRedEnvelopeReEntryPage()
                } else {
                    if (msg.data[0].amount > 0) {
                        this.showRedEnvelopeGetAwardPage(msg.data[0].amount)
                    } else {
                        this.showRedEnvelopeEmptyHandedPage()
                    }
                }
            }
        })
    };

    // 创建公共九宫格相关dom
    publicLotteryDom(dom, fun) {
        $(dom).append("<div class=\"publicLottery\">\n            <img src=\"./imgs/lottery/whiteClose.png\" class=\"whiteClose\">\n            <img src=\"./imgs/lottery/titleImg.png\" class=\"titleImg\">\n            <div class=\"lotteryCont\">\n                <div id=\"luck\">\n                    <table style=\"border-style:none; border: none;\" cellpadding=\"0\" cellspacing=\"0\">\n                        <tbody>\n                            <tr>\n                                <td class=\"luck-unit luck-unit-0 active\">\n                                    <img>\n                                    <p></p>\n                                </td>\n                                <td class=\"luck-unit luck-unit-1\">\n                                    <img>\n                                    <p></p>\n                                </td>\n                                <td class=\"luck-unit luck-unit-2\">\n                                    <img>\n                                    <p></p>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td class=\"luck-unit luck-unit-7\">\n                                    <img>\n                                    <p></p>\n                                </td>\n                                <td class=\"cjBtn\" id=\"lotteryBtn\"></td>\n                                <td class=\"luck-unit luck-unit-3\">\n                                    <img>\n                                    <p></p>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td class=\"luck-unit luck-unit-6\">\n                                    <img>\n                                    <p></p>\n                                </td>\n                                <td class=\"luck-unit luck-unit-5\">\n                                    <img>\n                                    <p></p>\n                                </td>\n                                <td class=\"luck-unit luck-unit-4\">\n                                    <img>\n                                    <p></p>\n                                </td>\n                            </tr>\n                        </tbody>\n                    </table>\n                    <p>您还有<b class=\"lotteryNum\"></b>次抽奖机会</p>\n                </div>\n            </div>\n            <div class='lotteryMark'>\n                <div class='getPrize'><img src='./imgs/lottery/whiteClose.png' class='lotteryMarkClose'>\n                    <h1>恭喜你</h1>\n                    <p>获得一张<b class='prizeName'></b>，请在“我的——我的奖品”中查看~</p><img class='lotteryPrize'>\n                    <div class='btnList'><button>确定</button></div>\n                </div>\n                <div class='getGold'><img src='./imgs/lottery/whiteClose.png' class='lotteryMarkClose'>\n                    <h1>恭喜你</h1>\n                    <p>获得<b class='prizeName'></b>，请在应声互动APP</p>\n                    <p>“我的-金币”内查看~</p> <img  class='goldImg'>\n                    <div class='btnList'><button>确定</button></div>\n                </div>\n                <div class='againLottery'><img src='./imgs/lottery/whiteClose.png' class='lotteryMarkClose'>\n                    <h1>再试试吧</h1>\n                    <p>矮油，手气不太好呢，再试试吧~</p><img src='./imgs/againImg.png' class='againImg'>\n                    <div class='btnList'><button>确定</button></div>\n                </div>\n                <div class='lotteryNone'><img src='./imgs/lottery/whiteClose.png' class='lotteryMarkClose'>\n                    <img src=\"./imgs/lottery/lotteryNoneImg.png\" class=\"lotteryNoneImg\">\n                    <div class='btnList'><button></button></div>\n                </div>\n            </div>\n        </div>");
        if (actionsfun.msg.jiuSkin && actionsfun.msg.jiuSkin.activityResource.blockInfoList[0].bgPicUrl) {
            $('.publicLottery').css('background-image', "url(" + actionsfun.msg.jiuSkin.activityResource.blockInfoList[0].bgPicUrl + ")")
        }
        if (actionsfun.msg.jiuSkin && actionsfun.msg.jiuSkin.activityResource.blockInfoList[0].bgFramePicUrl) {
            $('#luck').css('background-image', "url(" + actionsfun.msg.jiuSkin.activityResource.blockInfoList[0].bgFramePicUrl + ")")
        }
        $('.publicLottery').fadeIn()
        fun && fun()
    }
    // 通用九宫格获取奖品数据
    publicLotteryData(token) {
        $('.publicLottery').fadeIn()
        actionsfun.publicLotteryClick() // 注册点击
        //获取九宫格奖品
        $.ajax({
            url: API_PRE_URL + "/main/poolPoint/getGeneralPoolAward",
            contentType: "application/json",
            dataType: "json",
            type: "post",
            async: false,
            data: JSON.stringify({
                data: {
                    activityId: actionsfun.activityId,
                    channelActivityId: actionsfun.channelActivityId,
                    pointId: actionsfun.pointId,
                    programId: actionsfun.programId,
                    resourceId: null,
                    tokenKey: actionsfun.pointId + ':' + actionsfun.msg.jiuSkin.activityResource.blockInfoList[0].awardLabelName
                },
                token: token
            }),
            success: function success(res) {
                console.log(res);
                if (res.success) {
                    actionsfun.lotteryCanDrawCount = res.data[0].remainNum; // 使用数据里的次数
                    if (actionsfun.lotteryCanDrawCount == 0) {
                        $('.publicLottery .cjBtn').addClass('flaseBtn')
                    }
                    $('.lotteryNum').html(actionsfun.lotteryCanDrawCount)
                    res.data.forEach(function (item, index) {
                        $('.luck-unit-' + index + ' img').attr('src', item.awardPic);
                        $('.luck-unit-' + index + ' p').html(item.awardName);
                        actionsfun.dataArr.push(item.id);
                    });
                    $('#lotteryBtn').on('click', function () {
                        console.log(actionsfun.lotteryCanDrawCount)
                        if (actionsfun.lotteryCanDrawCount) {
                            if (actionsfun.lotteryCli) {
                                return false
                            } else {
                                actionsfun.lotteryCli = true;
                                // 获取奖品
                                actionsfun.getPrizes(actionsfun.msg.jiuSkin.activityResource.blockInfoList[0].awardLabelName, token, function (msg) {
                                    console.log(msg)
                                    if (msg.success) {
                                        actionsfun.lotteryCanDrawCount--
                                        if (actionsfun.lotteryCanDrawCount == 0) {
                                            $('.publicLottery .cjBtn').addClass('flaseBtn')
                                        }
                                        $('.lotteryNum').html(actionsfun.lotteryCanDrawCount)
                                        actionsfun.lotteryLuck.speed = 100;
                                        actionsfun.lotteryRoll();
                                        actionsfun.lotteryLuck.init('luck')
                                        let prizeData = msg.data[0]
                                        console.log(prizeData)
                                        if (prizeData.awardType == 0) { // 券
                                            setTimeout(function () {
                                                $('.lotteryMark').fadeIn()
                                                $('.getPrize').fadeIn() // 改
                                                $('.getPrize .prizeName').html(prizeData.awardName);
                                                $('.lotteryPrize').attr('src', prizeData.awardPic)
                                            }, 6000)
                                        } else if (prizeData.awardType == 2) {// 金币
                                            setTimeout(function () {
                                                $('.lotteryMark').fadeIn()
                                                $('.getGold').fadeIn() // 改
                                                $('.getGold .prizeName').html(prizeData.awardName);
                                                $('.goldImg').attr('src', prizeData.awardPic)
                                            }, 5500)
                                        } else if (prizeData.awardType == 3) { // 谢谢惠顾
                                            setTimeout(function () {
                                                $('.lotteryMark').fadeIn()
                                                $('.againLottery').fadeIn()
                                            }, 4500)
                                        }
                                        let gitsId = prizeData.id;
                                        actionsfun.overInd = actionsfun.dataArr.indexOf(gitsId);
                                        console.log(gitsId, actionsfun.overInd)
                                    } else {
                                        $('.lotteryMark').fadeIn()
                                        $('.lotteryNone').fadeIn()
                                    }
                                })
                                return false;
                            }
                        } else if (actionsfun.lotteryCanDrawCount <= 0 && actionsfun.lotteryCli == false) {
                            $('.lotteryMark').fadeIn();
                            $('.lotteryNone').fadeIn()
                            $('.publicLottery .cjBtn').addClass('flaseBtn')
                        }
                    });
                }
            }
        });
    }
    // 通用九宫格点击事件
    publicLotteryClick() {
        $('.lotteryNone button ,.getGold button,.getPrize button,.againLottery button').on('click', function () {
            $(this).parent().parent().fadeOut()
            $(this).parent().parent().parent().fadeOut()
            actionsfun.lotteryCli = false
        })
        $('.lotteryMarkClose').on('click', function () {
            $(this).parent().fadeOut()
            $(this).parent().parent().fadeOut()
            actionsfun.lotteryCli = false
        })
        $('.whiteClose').on('click', function () {
            actionsfun.removePublicLottery()
        })
        $('.lotteryCloseBtn').on('click', function () {
            $('.lotteryPage').fadeOut();
            $('.lotteryMark').fadeOut();
        })
    }
    // 移除通用九宫格dom
    removePublicLottery() {
        const that = this
        $('.publicLottery').fadeOut(function () {
            $('.publicLottery').remove()
            that.publicFuncAfterClose()
        })
    };
    // 初始化结束页互动点
    initPublicFinishPop(dataObj) {
        this.injectPublicFinishPopDom(dataObj.nextNoice)
        this.bindPublicFinishClick()
    };
    // 插入结束页互动点dom, data为下期预告string
    injectPublicFinishPopDom(data) {
        let htmlStr =
            `<div class="publicFinishPage">
                <img src="https://pic-oss.lingkehudong.com/images/publicInteractionPoint/closeBtn.png" alt=""
                    class="closeInPublicFinishPage">
                <div class="publicFinishPageMainBox">
                    <img src="https://pic-oss.lingkehudong.com/images/publicInteractionPoint/bgTop.jpg" alt="" class="topBg">
                    <div class="letterBg">
                        <p class="titleText">下期节目预告</p>
                        <p class="contentText">
                            ${data}
                        </p>
                    </div>
                </div>
            </div>`
        $('body').append(htmlStr);
        $('.publicFinishPage').fadeIn('fast');
    };
    // 删除结束页互动点dom
    removePublicFinishPopDom() {
        let elem = document.querySelector('.publicFinishPage');
        elem && elem.parentNode.removeChild(elem);
    }
    // 注册结束页点击
    bindPublicFinishClick() {
        $('.publicFinishPage .closeInPublicFinishPage').click(() => {
            $('.publicFinishPage').fadeOut('fast');
            this.publicFuncAfterClose()
        });
    };
}
const actionsfun = new actionsFun()