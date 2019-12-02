function loadPageContent(token) {
  function mainFun() { }
  mainFun.prototype = {
    pointId: '',
    planId: '',
    watermarkId: getUrlParam('watermarkId'),
    getData: function () {
      getData('/activity/interactionPoint/getPointData', { // 获取首页数据
        data: {
          watermarkId: mainfun.watermarkId
        },
        token: token
      }, function (msg) {
        if (msg.success) {
          if (actionsfun.pointId != msg.data.point.id) {
            actionsfun.pointId = msg.data.point.id
            actionsfun.programId = msg.data.programId
            actionsfun.activityId = msg.data.activityId
            actionsfun.channelActivityId = msg.data.channelActivityId
            actionsfun.enterpriseId = msg.data.enterpriseId
            actionsfun.msg = msg.data.msg
            mainfun.pointId = msg.data.point.id
            actionsfun.removeAction()
            var className = msg.data.className
            switch (className) {
              case 'lottery':
                actionsfun.lotteryFun(msg.data.otherMsg.lotteryPlanId, token)  // planId 奖励计划Id
                break;
              case 'redPaper':
                /**
                 * 第一个参数 // 0代表美食 1闽南语 2泉城搜go 3新闻相拍报
                 * 第二个参数 token
                 * 第三个参数 配置文案
                 */
                actionsfun.redPaperFun(0, token, {})
                break;
              default:
                actionsfun.selectClassName(className, token)
                break;
            }
          }
        }
      })
    },
  }
  // 轮询接口
  mainFun.prototype.pollingRequest = (function () {
    var pointId = null;
    return function () {
      var that = this
      getDataPromise('/activity/interactionPoint/getPointData', {
        token: token,
        data: {
          watermarkId: that.watermarkId
        }
      }).then(function (msg) {
        if (msg.success) {
          if (pointId != msg.data.point.id) {
            pointId = msg.data.point.id
            actionsfun.selectClassName(msg.data.className, token, msg.data, that)
          }
        } else {
          console.log('getData, message: error')
        }
      }).always(function () {
        setTimeout(that.pollingRequest.bind(that), 2000)
      })
    }
  })()

  var mainfun = new mainFun()

  mainfun.pollingRequest()
  actionsfun.initPublicFinishPop()
  // actionsfun.setFuncAfterRedEnvelopePageClosed(function () {
  //     console.log('2');
  //     // console.log(this.pointId);
  // })
  // actionsfun.setFuncAfterRedEnvelopePageClosed(() => {
  //     console.log('3');
  // })
  // actionsfun.closeRedEnvelopePage()

}
