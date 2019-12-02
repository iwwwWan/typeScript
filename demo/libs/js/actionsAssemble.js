function actionsFun() {  }
actionsFun.prototype = {
    lotteryCli:false, // 九宫格点击判断
    dataArr:[], // 九宫格奖品列表
    lotteryCanDrawCount:0,
    lotteryLuck:{ // 九宫格配置项
        index: 0, //当前转动到哪个位置，起点位置
        count: 0, //总共有多少个位置
        timer: 0, //setTimeout的ID，用clearTimeout清除
        speed: 20, //初始转动速度
        times: 0, //转动次数
        cycle: 50, //转动基本次数：即至少需要转动多少次再进入抽奖环节
        prize: -1, //中奖位置
        init: function init(id) {
            if ($("#" + id).find(".luck-unit").length > 0) {
                $luck = $("#" + id);
                $units = $luck.find(".luck-unit");
                this.obj = $luck;
                this.count = $units.length;
                $luck.find(".luck-unit-" + this.index).addClass("active");
            };
        },
        roll: function roll() {
            var index = this.index;
            var count = this.count;
            var luck = this.obj;
            $(luck).find(".luck-unit-" + index).removeClass("active");
            index += 1;
            if (index > count - 1) {
                index = 0;
            };
            $(luck).find(".luck-unit-" + index).addClass("active");
            this.index = index;
            return false;
        }
    },
    lotteryFun:function (dom,fun) { // 创建九宫格
        $(dom).append("<div id='luck'><table style='border-style:none; border: none;'  cellpadding='0' cellspacing='0'><tr><td class='luck-unit luck-unit-0 active'><img></td><td class='luck-unit luck-unit-1'><img></td><td class='luck-unit luck-unit-2'><img></td></tr><tr><td class='luck-unit luck-unit-7'><img></td><td class='cjBtn' id='lotteryBtn'></td><td class='luck-unit luck-unit-3'><img></td></tr><tr><td class='luck-unit luck-unit-6'><img></td><td class='luck-unit luck-unit-5'><img></td><td class='luck-unit luck-unit-4'><img></td></tr></table></div>");
        fun&&fun()
    },
    lotteryDom:function (dom,fun) { // 创建九宫格外层相关dom
        $(dom).append("<div class='lotteryPage'><img src='./imgs/lotteryMarkClose.png' class='lotteryCloseBtn'><div class='lotteryCont'><div class='rafflingNum'> 您还剩<b id='rafflingNum'></b>次抽奖机会</div></div><div class='lotteryMark'><div class='getPrize'><img src='./imgs/lotteryMarkClose.png' class='lotteryMarkClose'><h1>恭喜你</h1><p>获得一张<b class='prizeName'></b>，在商城下单可返现哦~</p><img src='./imgs/prize.png' class='lotteryPrize'><div class='btnList'><button class='intoMall'>立即下单</button></div></div><div class='getGold'><img src='./imgs/lotteryMarkClose.png' class='lotteryMarkClose'><h1>恭喜你</h1><p>获得<b class='prizeName'></b>，请在应声互动APP</p><p>“我的——我的钱包”内查看~</p> <img src='./imgs/188gold.png' class='goldImg'><button>确定</button></div><div class='againLottery'><img src='./imgs/lotteryMarkClose.png' class='lotteryMarkClose'><h1>再试试吧</h1><p>矮油，手气不太好呢，再试试吧~</p><img src='./imgs/againImg.png' class='againImg'><button>确定</button></div><div class='lotteryNone'><img src='./imgs/lotteryMarkClose.png' class='lotteryMarkClose'><h1>互动页的抽奖机会用完了</h1><p>您可以明天再来，或者参与应声互动<br>APP商城频道618活动页的抽奖哦~</p><button>我知道了</button></div></div></div></div>");
        fun&&fun()
    },
    lotteryData:function (data,token) {
        $('.lotteryPage').fadeIn()
        //获取九宫格奖品
        $.ajax({
            url: API_PRE_URL + "/food/getAwardUser",
            contentType: "application/json",
            dataType: "json",
            type: "post",
            async: false,
            data: JSON.stringify({
                data:data,
                token: token
            }),
            success: function success(res) {
                console.log(res);
                if(res.success){
                    console.log(res.data.canDrawCount)
                    actionsfun.lotteryCanDrawCount = res.data.canDrawCount; // 使用数据里的次数
                    $('#rafflingNum').html(actionsfun.lotteryCanDrawCount)
                    res.data.awards.forEach(function (item, index) {
                        $('.luck-unit-' + index + ' img').attr('src', item.weallogourl);
                        actionsfun.dataArr.push(item.id);
                    });
                    $('#lotteryBtn').on('click', function () {
                        console.log(actionsfun.lotteryCli)
                        console.log(actionsfun.lotteryCanDrawCount)
                        if(actionsfun.lotteryCanDrawCount){
                            if (actionsfun.lotteryCli) {
                                return false
                            } else {
                                actionsfun.lotteryCli = true;
                                // 获取奖品
                                $.ajax({
                                    url: API_PRE_URL + "/food/interactionAward",
                                    contentType: "application/json",
                                    dataType: "json",
                                    async: false,
                                    type: "post",
                                    data: JSON.stringify({
                                        data:data,
                                        token: token
                                    }),
                                    success: function success(res) {
                                        console.log(res);
                                        if(res.success){
                                            actionsfun.lotteryCanDrawCount--
                                            $('#rafflingNum').html(actionsfun.lotteryCanDrawCount)
                                            actionsfun.lotteryLuck.speed = 100;
                                            actionsfun.lotteryRoll();
                                            actionsfun.lotteryLuck.init('luck')
                                            var prizeData = res.data.awards[0]
                                            console.log(prizeData)
                                            if(prizeData.wealtypeid==2){ // 券
                                                setTimeout(function () {
                                                    $('.lotteryMark').fadeIn()
                                                    $('.getPrize').fadeIn() // 改
                                                    $('.getPrize .prizeName').html(prizeData.wealname);
                                                    $('.lotteryPrize').attr('src',prizeData.wealurl)
                                                },6000)
                                            }else if(prizeData.wealtypeid==4){// 金币
                                                setTimeout(function () { 
                                                    $('.lotteryMark').fadeIn()
                                                    $('.getGold').fadeIn() // 改
                                                    $('.getGold .prizeName').html(prizeData.wealname);
                                                    $('.goldImg').attr('src',prizeData.weallogourl)
                                                },5500)
                                            }else if(prizeData.wealtypeid==8){ // 谢谢惠顾
                                                setTimeout(function () {
                                                    $('.lotteryMark').fadeIn()
                                                    $('.againLottery').fadeIn()
                                                },4500)
                                            }
                                            var gitsId = prizeData.id;
                                            overInd = actionsfun.dataArr.indexOf(gitsId);
                                        }else{
                                            $('.lotteryMark').fadeIn()
                                            $('.lotteryNone').fadeIn()
                                        }
                                    }
                                });
                                return false;
                            }
                        }else if(actionsfun.lotteryCanDrawCount<=0 && actionsfun.lotteryCli==false){
                            $('.lotteryMark').fadeIn();
                            $('.lotteryNone').fadeIn()
                        }
                    });
                }
            }
        });
    },
    lotteryRoll:function () {
        actionsfun.lotteryLuck.times += 1;
        actionsfun.lotteryLuck.roll();
        if (actionsfun.lotteryLuck.times > actionsfun.lotteryLuck.cycle + 10 && actionsfun.lotteryLuck.prize == actionsfun.lotteryLuck.index) {
            clearTimeout(actionsfun.lotteryLuck.timer);
            actionsfun.lotteryLuck.prize = -1;
            actionsfun.lotteryLuck.times = 0;
            click = false;
        } else {
            if (actionsfun.lotteryLuck.times < actionsfun.lotteryLuck.cycle) {
                actionsfun.lotteryLuck.speed -= 10;
            } else if (actionsfun.lotteryLuck.times == actionsfun.lotteryLuck.cycle) {
                var index = Math.random() * actionsfun.lotteryLuck.count | 0;
                actionsfun.lotteryLuck.prize = overInd; //最终中奖位置
            } else {
                if (actionsfun.lotteryLuck.times > actionsfun.lotteryLuck.cycle + 10 && (actionsfun.lotteryLuck.prize == 0 && actionsfun.lotteryLuck.index == 7 || actionsfun.lotteryLuck.prize == actionsfun.lotteryLuck.index + 1)) {
                    actionsfun.lotteryLuck.speed += 110;
                } else {
                    actionsfun.lotteryLuck.speed += 20;
                }
            }
            if (actionsfun.lotteryLuck.speed < 40) {
                actionsfun.lotteryLuck.speed = 40;
            };

            actionsfun.lotteryLuck.timer = setTimeout(actionsfun.lotteryRoll, actionsfun.lotteryLuck.speed);
        }
        return false;
    },
    lotteryClick:function () {
        $('.lotteryNone button ,.againLottery button ,.getGold button,.lotteryMarkClose').on('click',function () {
            $(this).parent().fadeOut()
            $(this).parent().parent().fadeOut()
            actionsfun.lotteryCli = false
        })
        $('.lotteryCloseBtn').on('click',function () {
            $('.lotteryPage').fadeOut();
            $('.lotteryMark').fadeOut();
        })
        $('.intoMall').on('click',function () {
            if(pro){
                backBtn('http://constant-info.lingkehudong.com/app-mall/Main/index.html','返回互动')
                window.location.href = 'http://constant-info.lingkehudong.com/app-mall/Main/index.html'
            }else{
                backBtn('http://constant-info-dev.lingkehudong.com/app-mall/Main/index.html','返回互动')
                window.location.href = 'http://constant-info-dev.lingkehudong.com/app-mall/Main/index.html'
            }
        })
    }
}
var actionsfun = new actionsFun()