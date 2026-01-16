(function (window) {

  /***********************
   * WebsockFeed (script)
   ***********************/

  function WebsockFeed(url, coin, stompClient, scale) {
    this._datafeedURL = url;
    this.coin = coin;
    this.stompClient = stompClient;
    this.lastBar = null;
    this.currentBar = null;
    this.subscribe = true;
    this.scale = scale;
  }

  /*************** onReady ****************/

  WebsockFeed.prototype.onReady = function (callback) {
    var config = {};
    config.exchanges = [];
    config.supported_resolutions = ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"];
    config.supports_group_request = false;
    config.supports_marks = false;
    config.supports_search = false;
    config.supports_time = true;
    config.supports_timescale_marks = false;

    $("#" + window.tvWidget.id)
      .contents()
      .on("click", ".date-range-list>a", function () {
        if (!window.tvWidget) return;

        if ($(this).html() === "分时") {
          $(this).parent().addClass("real-op").removeClass("common-op");
          window.tvWidget.chart().setChartType(3);
        } else {
          $(this).parent().addClass("common-op").removeClass("real-op");
          window.tvWidget.chart().setChartType(1);
        }
      });

    setTimeout(function () {
      callback(config);
    }, 0);
  };

  /*************** subscribeBars ****************/

  WebsockFeed.prototype.subscribeBars = function (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    listenerGUID,
    onResetCacheNeededCallback
  ) {
    var that = this;

    this.stompClient.subscribe('/topic/market/trade/' + symbolInfo.name, function (msg) {
      var resp = JSON.parse(msg.body);

      if (that.lastBar && resp.length > 0) {
        var price = resp[resp.length - 1].price;

        that.lastBar.close = price;
        if (price > that.lastBar.high) that.lastBar.high = price;
        if (price < that.lastBar.low) that.lastBar.low = price;

        onRealtimeCallback(that.lastBar);
      }
    });

    this.stompClient.subscribe('/topic/market/kline/' + symbolInfo.name, function (msg) {
      if (resolution !== "1") return;

      if (that.currentBar) {
        onRealtimeCallback(that.currentBar);
      }

      var resp = JSON.parse(msg.body);
      that.lastBar = {
        time: resp.time,
        open: resp.openPrice,
        high: resp.highestPrice,
        low: resp.lowestPrice,
        close: resp.closePrice,
        volume: resp.volume
      };

      that.currentBar = that.lastBar;
      onRealtimeCallback(that.lastBar);
    });
  };

  /*************** unsubscribeBars ****************/

  WebsockFeed.prototype.unsubscribeBars = function () {
    this.subscribe = false;
  };

  /*************** resolveSymbol ****************/

  WebsockFeed.prototype.resolveSymbol = function (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback
  ) {
    var name = symbolName || "BTC/USDT"
    var data = {
      name: name,
      "exchange-traded": "",
      "exchange-listed": "",
      minmov: 1,
      volumescale: 10000,
      has_daily: true,
      has_weekly_and_monthly: true,
      has_intraday: true,
      description: name,
      type: "bitcoin",
      session: "24x7",
      supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"],
      pricescale: Math.pow(10, 2),
      ticker: name,
      timezone: "Asia/Shanghai"
    };

    setTimeout(function () {
      onSymbolResolvedCallback(data);
    }, 0);
  };

  /*************** ajax helper ****************/

  WebsockFeed.prototype._send = function (url, params) {
    var request = url;

    if (params) {
      var keys = Object.keys(params);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        request += (i === 0 ? '?' : '&') + key + '=' + encodeURIComponent(params[key]);
      }
    }

    return $.ajax({
      type: 'GET',
      url: request,
      dataType: 'json'
    });
  };

  /*************** getBars ****************/

  WebsockFeed.prototype.getBars = function (
    symbolInfo,
    resolution,
    from,
    to,
    onHistoryCallback,
    onErrorCallback,
    firstDataRequest
  ) {
    var bars = [];
    var that = this;

    this._send(this._datafeedURL + '/history', {
      symbol: symbolInfo.name,
      from: from * 1000,
      to: firstDataRequest ? Date.now() : to * 1000,
      resolution: resolution
    })
      .done(function (data) {
        for (var i = 0; i < data.length; i++) {
          var item = data[i];
          bars.push({
            time: item[0],
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
            volume: item[5]
          });
        }

        that.lastBar = bars.length ? bars[bars.length - 1] : null;
        that.currentBar = that.lastBar;

        onHistoryCallback(bars, { noData: bars.length === 0 });
      })
      .fail(function (err) {
        onErrorCallback(err);
      });
  };

  /*************** periodLengthSeconds ****************/

  WebsockFeed.prototype.periodLengthSeconds = function (resolution, requiredPeriodsCount) {
    var daysCount = 0;

    if (resolution === 'D') {
      daysCount = requiredPeriodsCount;
    } else if (resolution === 'W') {
      daysCount = 7 * requiredPeriodsCount;
    } else if (resolution === 'M') {
      daysCount = 31 * requiredPeriodsCount;
    } else {
      daysCount = requiredPeriodsCount * resolution / (24 * 60);
    }

    return daysCount * 86400;
  };

  /*************** 挂到 window ****************/

  window.WebsockFeed = WebsockFeed;

})(window);