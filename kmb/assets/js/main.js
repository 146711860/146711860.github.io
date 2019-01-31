$(function() {
	$('#routeForm').submit(function(e) {
		e.preventDefault();

		$.ajax({
			type: 'POST',
			url: 'http://search.kmb.hk/KMBWebSite/Function/FunctionRequest.ashx?' + $(this).serialize()
		}).always(function() {
			$('#routeBasicInfo, #routeStops').html('');
		}).done(function(data) {
			console.log(data);

			if(data.result) {
				$('#routeBasicInfo').html(data.data.basicInfo.OriCName + ' -> ' + data.data.basicInfo.DestCName);

				$.each(data.data.routeStops, function(index, item) {
					$('<li>').addClass('stop').html(item.CName).data({
						bsiCode: item.BSICode,
						route: item.Route,
						seq: item.Seq
					}).appendTo('#routeStops');
				});
			}
		});
	});

	$('#routeStops').on('click', 'li.stop', function(e) {
		if(e.target != this) {
			return;
		}

		var that = this;
		var routeData = $(this).data();
		var d = new Date();
		var ymd = d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
		var timestamp = ymd + ' ' + ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2) + ':' + ('0' + d.getUTCSeconds()).slice(-2) + '.' + ('00' + d.getUTCMilliseconds()).slice(-2) + '.';
		var sep = '--31' + timestamp + '13--';
		var bound = $('#routeForm').find('[name=bound]:checked').val();
		var serviceType = '1';
		var time = d.getTime();
		var token = 'EA' + btoa(routeData.route + sep + bound + sep + serviceType + sep + routeData.bsiCode.replace('-', '') + sep + routeData.seq + sep + time);

		$.ajax({
			type: 'POST',
			url: 'http://search.kmb.hk/KMBWebSite/Function/FunctionRequest.ashx/?action=get_ETA&lang=1',
			data: {
				token: token,
				t: timestamp
			}
		}).always(function() {
			$(that).find('ul').remove();
		}).done(function(data) {
			console.log(data);

			if(data.result) {
				if(data.data.response.length > 0) {
					var $list = $('<ul>').appendTo($(that));
					var etaInfo = [];
					var generatedDate = new Date(data.data.generated);

					$.each(data.data.response, function(index, item) {
						if(item.t && item.t != null) {
							var eta = item.t.substring(0, 5);
							var scheduled = ' ' + item.t.substring(5).trim();
							var message = item.msg == null ? '' : item.msg;
							var d = new Date();
							var etaDateTime = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + ' ' + eta + ':00';
							var diff = Math.floor((generatedDate.getTime() - new Date(etaDateTime).getTime()) / 1000 / 60 * -1);

							if(diff >= 0) {
								etaInfo.push(etaDateTime + ' ' + (diff == 0 ? '即將到達' : diff + ' 分鐘') + message + scheduled);
							}
						}
					});

					if(etaInfo.length == 0) {
						$('<li>').html('暫時無法提供').appendTo($list);
					}

					$.each(etaInfo, function(index, item) {
						$('<li>').html(item).appendTo($list);
					});
				}
			}
		});
	});
});