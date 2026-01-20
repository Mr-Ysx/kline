function getLang4K(curlang) {
	console.log(curlang)
	if (curlang == 'en_US') {
		return 'en'
	}
	if (curlang == 'ja') {
		return 'ja'
	}
	if (curlang == 'ko_KR') {
		return 'ko'
	}
	if (curlang == 'de_DE') {
		return 'de_DE'
	}
	if (curlang == 'fr_FR') {
		return 'fr'
	}
	if (curlang == 'it_IT') {
		return 'it'
	}
	if (curlang == 'es_ES') {
		return 'es'
	}
	if (curlang == "hi_IN") {
		return "hi";
	}
	if (curlang == "ru_RU") {
		return "ru";
	}
	if (curlang == "vi_VN") {
		return "vi";
	}
	if (curlang == 'zh_HK') {
		return 'zh_TW'
	}
	if (curlang == 'zh_CN') {
		return 'zh'
	}
	return curlang
}

function getTimezone4K(curlang){
	console.log(curlang)
		if(curlang=="en_US"){
			return "America/Los_Angeles";
		}
		if(curlang=="ja"){
			return "Asia/Tokyo";
		}
		if(curlang=="ko_KR"){
			return "Asia/Seoul";
		}
		if(curlang=="de_DE"){
			return "Europe/Berlin";
		}
		if(curlang=="fr_FR"){
			return "Europe/Paris";
		}
		if(curlang=="it_IT"){
			return "Europe/Rome";
		}
		if(curlang=="es_ES"){
			return "Europe/Madrid";
		}
		if(curlang=="zh_HK"){
			return "Asia/Hong_Kong";
		}
		if(curlang=="zh_CN"){
			return "Asia/Shanghai";
		}
		if(curlang=="hi_IN"){
			return "Asia/India";
		}
		if(curlang=="ru_RU"){
			return "Europe/Russia";
		}
		return curlang;
};
function getKline(options) {
	var symbol = options.symbol; // BTCUSDT
	var datafeed = options.datafeed; // new WebsockFeed(...)
	var skin = options.skin || 'night'; // day / night
	var lang = getLang4K(options.lang) || 'en';
	var timezone =getTimezone4K(options.lang) || 'America/Los_Angeles';

	var config = {
		autosize: true,
		height: 800,
		fullscreen: window.innerWidth > 767,
		symbol: symbol,
		interval: '5',
		timezone: timezone,
		toolbar_bg: '#ffffff',
		container_id: 'kline_container',
		datafeed: datafeed,
		library_path: '/charting_library/',
		locale: lang,
		debug: false,
		disabled_features: [
			'header_indicators',
			'header_resolutions',
			'timeframes_toolbar',
			'header_symbol_search',
			'header_chart_type',
			'header_compare',
			'header_undo_redo',
			'header_screenshot',
			'header_saveload',
			'volume_force_overlay',
			'widget_logo',
			'compare_symbol',
			'display_market_status',
			'go_to_date',
			'header_interval_dialog_button',
			'legend_context_menu',
			'show_hide_button_in_legend',
			'edit_buttons_in_legend',
			'context_menus',
			'control_bar',
			'border_around_the_chart',
			'header_fullscreen_button', // 全屏
			// "header_settings" // 设置
		],

		enabled_features: [
			'disable_resolution_rebuild',
			'use_localstorage_for_settings',
			'left_toolbar',
			'header_in_fullscreen_mode'
		],

		studies_overrides: {
			'volume.volume.color.0': '#ef5350',
			'volume.volume.color.1': '#26a69a',
			'volume.volume.transparency': 70,
		},

		overrides: {
			'paneProperties.background': '#ffffff',
			'paneProperties.vertGridProperties.color': '#e9ecef',
			'paneProperties.horzGridProperties.color': '#e9ecef',
			'scalesProperties.textColor': '#343a40',

			// 蜡烛图颜色（上涨绿色 / 下跌红色）
			'mainSeriesProperties.candleStyle.upColor': '#26a69a',     // 上涨阳线（绿色系）
			'mainSeriesProperties.candleStyle.downColor': '#ef5350',   // 下跌阴线（红色系）
			'mainSeriesProperties.candleStyle.drawBorder': true,
			'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
			'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',

			// 成交量颜色
			'volumePaneSize': 'small',
			'volume.volume.color.0': '#ef5350', // 下跌成交量（红）
			'volume.volume.color.1': '#26a69a', // 上涨成交量（绿）
			'volume.volume.transparency': 70,

			// 图例
			'paneProperties.legendProperties.showLegend': true,

			// 面积图（如果用到）
			'mainSeriesProperties.areaStyle.color1': 'rgba(38, 166, 154, 0.2)',
			'mainSeriesProperties.areaStyle.color2': 'rgba(38, 166, 154, 0.2)',
			'mainSeriesProperties.areaStyle.linecolor': '#26a69a',
			volumePaneSize: 'small',
		},

		time_frames: [{
			text: '1min',
			resolution: '1'
		},
		{
			text: '5min',
			resolution: '5'
		},
		{
			text: '15min',
			resolution: '15'
		},
		{
			text: '30min',
			resolution: '30'
		},
		{
			text: '1hour',
			resolution: '60'
		},
		{
			text: '4hour',
			resolution: '240'
		},
		{
			text: '1day',
			resolution: '1D'
		},
		{
			text: '1week',
			resolution: '1W'
		},
		{
			text: '1mon',
			resolution: '1M'
		}
		]
	};

	// 白天皮肤
	if (skin === 'day') {
		config.toolbar_bg = '#fff';
		config.overrides['paneProperties.background'] = '#fff';
		config.overrides['mainSeriesProperties.candleStyle.upColor'] = '#a6d3a5';
		config.overrides['mainSeriesProperties.candleStyle.downColor'] = '#ffa5a6';
	}

	// ===== 创建 TradingView =====
	window.tvWidget = new TradingView.widget(config);

	tvWidget.onChartReady(function () {
		var chart = tvWidget.chart();

		// 均线
		if (window.innerWidth > 767) {
			chart.createStudy('Moving Average', false, false, [5], null, {
				'plot.color': '#EDEDED'
			});
			chart.createStudy('Moving Average', false, false, [10], null, {
				'plot.color': '#ffe000'
			});
			chart.createStudy('Moving Average', false, false, [30], null, {
				'plot.color': '#ce00ff'
			});
			chart.createStudy('Moving Average', false, false, [60], null, {
				'plot.color': '#00adff'
			});
		}

		// ===== 自定义按钮 =====
		const allBtns = []; // 保存所有自定义按钮

		function createBtn(text, resolution, chartType) {
			const btn = tvWidget
				.createButton()
				.attr('title', text)
				.append('<span>' + text + '</span>');

			const defaultStyle = 'color: #787170';
			const activeStyle = 'color: #2E201F';

			// 所有按钮的 defaultStyle 都是普通色
			btn.data('defaultStyle', defaultStyle);

			// 初始状态：如果是 M5，应用激活样式并标记为已选中
			if (resolution === '5') {
				btn.attr('style', activeStyle).addClass('selected');
			} else {
				btn.attr('style', defaultStyle);
			}

			allBtns.push(btn);

			btn.on('click', function () {
				const $this = $(this);

				// 恢复其他按钮为默认样式
				allBtns.forEach(b => {
					if (b[0] !== $this[0]) {
						b.attr('style', b.data('defaultStyle')).removeClass('selected');
					}
				});

				// 当前按钮设为激活样式
				$this.attr('style', activeStyle).addClass('selected');

				// 切换图表类型和周期
				chart.setChartType(chartType || 1);
				tvWidget.setSymbol(symbol, resolution); // 注意：这里应该是 symbol，不是空字符串
			});

			return btn;
		}

		createBtn('Time', '1', 3);
		createBtn('M1', '1');
		createBtn('M5', '5');
		createBtn('M15', '15');
		createBtn('M30', '30');
		createBtn('H1', '60');
		createBtn('H4', '240');
		createBtn('D1', '1D');
		createBtn('W1', '1W');
		createBtn('M1', '1M');
	});
}