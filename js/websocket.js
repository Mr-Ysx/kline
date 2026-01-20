// 全局变量（模拟原 Vue 组件的 data）
var stompClient = null;
var baseCoinScale = 8; // 根据实际情况设置
var isLogin = false; // 登录状态
var skin = 'night'; // 或 'day'

// 盘口和成交数据
var plateData = {
	askRows: [],
	bidRows: [],
	askTotle: 0,
	bidTotle: 0,
	maxPostion: 20 // 假设显示20档
};
var tradeList = []; // 最新成交列表
let client = null;  // 全局客户端
let isConnected = false; // 全局状态标记


// 关闭旧连接
function startWebsock(currentSymbol, wsUrl, memberId, host,lang) {
	if (typeof StompJs === 'undefined') {
		alert('❌ STOMP 库未加载成功！请检查 stompjs.js 是否正确引入。');
	} else {
		// 创建 STOMP 客户端

		// 如果已有连接，则先断开
		if (client && isConnected) {
			console.log('⚠️ 已有 WebSocket 连接，正在断开旧连接...');
			stopWebSocket();
		}
		client = new StompJs.Client({
			brokerURL: wsUrl,
			reconnectDelay: 5000, // 断线后 5 秒重连
			heartbeatIncoming: 4000, // 接收心跳间隔（毫秒）
			heartbeatOutgoing: 4000, // 发送心跳间隔（毫秒）
			// 可选：添加连接头（如认证 token）
			// connectHeaders: { Authorization: 'Bearer your-token' }
		});

		// 连接成功回调
		client.onConnect = () => {
			console.log('✅ STOMP 连接成功，正在订阅主题...');
			const datafeed = new WebsockFeed(
				host + '/market',
				currentSymbol,
				client,
				baseCoinScale
			)
			getKline({
				symbol: currentSymbol,
				datafeed: datafeed,
				lang: lang
			})


			// 订阅盘口
			client.subscribe('/topic/market/trade-plate/' + currentSymbol, (message) => {
				// console.log('trade-plate成功')
				try {
					const res = JSON.parse(message.body);
					// console.log('订阅成功：',res)
					if (res.direction === 'SELL') {
						sellOrderLists(res.items)
					}
					if (res.direction === 'BUY') {
						buyOrderLists(res.items)
					}
				} catch (err) {
					console.error('⚠️ 消息解析失败:', message.body, err);
				}
			});

			// 订阅：实时成交信息
			let tradeLists = [];

			client.subscribe('/topic/market/trade/' + currentSymbol, function (msg) {
				// console.log('trade成功')

				try {
					const res = JSON.parse(msg.body);

					// 确保 res 是数组
					if (!Array.isArray(res) || res.length === 0) return;

					// 1. 批量添加新数据到头部（最新在前）
					tradeLists.unshift(...res); // 使用展开运算符一次性插入

					// 2. 限制最多保留 30 条
					if (tradeLists.length > 30) {
						tradeLists = tradeLists.slice(0, 30);
					}

					// 3. 只调用一次 UI 更新
					newOrders(tradeLists);

				} catch (err) {
					console.error('❌ 解析交易消息失败:', msg.body, err);
				}
			});

			// 头部信息
			client.subscribe('/topic/market/thumb', function (msg) {
				// console.log('thumb成功')
				var res = JSON.parse(msg.body);
				if (res.symbol === currentSymbol) {
					headerInfo(res)
				}
			})

			// k 线数据在bitrade里边请求了
		};

		// 连接失败或 STOMP 协议错误
		client.onStompError = (frame) => {
			console.error('❌ STOMP 协议错误:', frame.headers['message'], frame.body);
		};

		// 网络断开（WebSocket 层）
		client.onWebSocketClose = (event) => {
			console.warn('🔌 WebSocket 连接已关闭，将在 5 秒后尝试重连...', event.code, event.reason);
		};

		// 连接异常（如无法建立 WebSocket）
		client.onWebSocketError = (error) => {
			console.error('🌐 WebSocket 连接出错:', error);
		};

		// 激活客户端（发起连接）
		try {
			client.activate();
			console.log('🔄 正在连接到 WebSocket 服务器...');
		} catch (err) {
			console.error('💥 启动 STOMP 客户端失败:', err);
			alert('无法启动 WebSocket 连接，请检查网络或服务状态。');
		}
	}
}

function stopWebSocket() {
	if (client) {
		console.log('🛑 正在断开 WebSocket 连接...');
		client.deactivate();
		isConnected = false;
		client = null;
	}
}

// 盘口兜底api
function getplatemini(host, symbol) {

	$.ajax({
		url: host + '/market/exchange-plate-mini', // 请替换为实际的 platemini 接口地址
		method: 'POST',
		data: {
			symbol: symbol
		}, // 根据后端要求调整参数格式（可能是 query 或 body）
		success: function (res) {
			if (res.ask) {
				sellOrderLists(res.ask.items)
			}
			if (res.bid) {
				buyOrderLists(res.bid.items)
			}
		},
		error: function (xhr, status, error) {
			console.error('获取盘口数据失败:', error);
			// 可选：显示错误提示
		}
	});
}

// 实施成交兜底api
function getLatesttrade(host, symbol) {

	$.ajax({
		url: host + '/market/latest-trade', // 请替换为实际的 platemini 接口地址
		method: 'POST',
		data: {
			symbol: symbol,
			size: 20
		}, // 根据后端要求调整参数格式（可能是 query 或 body）
		success: function (res) {
			newOrders(res)
		},
		error: function (xhr, status, error) {
			console.error('获取盘口数据失败:', error);
			// 可选：显示错误提示
		}
	});
}

// 获取币种接口
let symbolLists = []
function getSymbolThumb(host, symbol) {
	$.ajax({
		url: host + '/market/symbol-thumb', // 请替换为实际的 platemini 接口地址
		method: 'POST',
		success: function (res) {
			renderDropdown(res)
			symbolLists = res
			symbolChange(symbol)
		},
		error: function (xhr, status, error) {
			console.error('获取盘口数据失败:', error);
			// 可选：显示错误提示
		}
	});
}



// 盘口数据循环
function sellOrderLists(lists) {
	const sellOrders = $('#sell-orders');
	const MAX_ROWS = 25;

	sellOrders.empty();

	// 最多取 30 条
	const showList = lists.slice(0, MAX_ROWS);

	lists.forEach(order => {
		const { price, amount } = order;

		const orderRowHtml = `
            <div class="orders-row sell">
                <div class="orders-row-bg sell" style="width: 50%;"></div>
                <div class="orders-row-content">
                    <span>${price}</span>
                    <span>${amount}</span>
                </div>
            </div>
        `;
		sellOrders.append(orderRowHtml);
	});

	// 不足 30 条补 "-"
	const emptyCount = MAX_ROWS - showList.length;
	if (emptyCount > 0) {
		for (let i = 0; i < emptyCount; i++) {
			sellOrders.append(`
            <div class="orders-row sell empty">
                <div class="orders-row-content">
                    <span>-</span>
                    <span>-</span>
                </div>
            </div>
        `);
		}
	}

}


function buyOrderLists(lists) {
	const buyOrders = $('#buy-orders');
	const MAX_ROWS = 25;

	buyOrders.empty();

	// 最多取 30 条
	const showList = lists.slice(0, MAX_ROWS);

	lists.forEach(order => {
		const { price, amount } = order;

		const orderRowHtml = `
            <div class="orders-row buy">
                <div class="orders-row-bg buy" style="width: 50%;"></div>
                <div class="orders-row-content">
                    <span>${price}</span>
                    <span>${amount}</span>
                </div>
            </div>
        `;
		buyOrders.append(orderRowHtml);
	});

	// 不足 30 条补 "-"
	const emptyCount = MAX_ROWS - showList.length;
	if (emptyCount > 0) {
		for (let i = 0; i < emptyCount; i++) {
			buyOrders.append(`
            <div class="orders-row buy empty">
                <div class="orders-row-content">
                    <span>-</span>
                    <span>-</span>
                </div>
            </div>
        `);
		}
	}

}

// 实时成交信息循环
function newOrders(data) {
	const $container = $('#new-orders-lists');
	const MAX_ROWS = 15;

	// 清空容器
	$container.empty();

	// 实际要展示的数据（最多 30 条）
	const showData = data.slice(0, MAX_ROWS);

	// 先渲染真实订单
	data.forEach(order => {
		const { price, amount, time, direction } = order;

		const color = direction === 'BUY' ? '#0ecb81' : '#f6465d';

		const $row = $(`
            <div class="orders-row">
                <span style="color:${color}">${price}</span>
                <span>${amount}</span>
                <span>${formatTime(time)}</span>
            </div>
        `);

		// 最新在上
		$container.prepend($row);
	});

	// 不足 30 条，用 "-" 补齐
	const emptyCount = MAX_ROWS - showData.length;
	if (emptyCount > 0) {
		for (let i = 0; i < emptyCount; i++) {
			const $emptyRow = $(`
            <div class="orders-row empty">
                <span>-</span>
                <span>-</span>
                <span>-</span>
            </div>
        `);
			$container.append($emptyRow);
		}
	}


}



// 时间转化
function formatTime(timestamp) {
	const date = new Date(timestamp);
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`
	// console.log(`${y}-${m}-${d}`);
}

// 渲染下拉选项
function renderDropdown(lists) {
	const $dropdownEl = $('.symbol-dropdown');
	$dropdownEl.empty(); // 清空内容（等价于 innerHTML = ''）

	lists.forEach(symbol => {
		const $item = $('<div class="dropdown-item"></div>').text(symbol.symbol);
		$item.on('click', function () {
			$('.header-symbol-title').text(symbol.symbol); // 回显选中项
			$dropdownEl.hide(); // 隐藏下拉
		});
		$dropdownEl.append($item);
	});
}

function headerInfo(res) {
	$('#lastPrice').text(res.close)
	$('#lastPriceUsd').text(res.turnover)
	// $('#changeValue').html(res.chg > 0 ? '+' + (res.chg * 100).toFixed(2) + '%' : (res.chg * 100).toFixed(2) + '%')
	$('#changePercent').text(res.usdRate)
	$('#high24h').text(res.high)
	$('#low24h').text(res.low)
	$('#vol24h').text(res.volume)
	const changePercent = (res.chg * 100).toFixed(2) + '%';
	const sign = res.chg > 0 ? '+' : '';
	const className = res.chg > 0 ? 'green' : 'red';

	$('#changeValue').html(`<span class="${className}">${sign}${changePercent}</span>`);
}

function symbolChange(symbol) {
	symbolLists.forEach(item => {
		if (item.symbol === symbol) {
			headerInfo(item)
		}
	})
}