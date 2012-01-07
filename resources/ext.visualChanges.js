// from http://stackoverflow.com/questions/2419749/get-selected-elements-outer-html/4180972#4180972
(function($) {
  $.fn.outerHtml = function() {
    return $(this).clone().wrap('<div></div>').parent().html();
  }
})(jQuery);
 
jQuery( document ).ready(function ( $ ) {
	function pad(number, length)
	{
		var str = '' + number;
		while (str.length < length) {
			str = '0' + str;
		}
		return str;
	}
    /* @TODO: check how to add portlet links?
mw.util.addPortletLink('p-tb', 'http://mediawiki.org/', 'MediaWiki.org');*/
 

	// functions for the buttons...
	var visualChangesUI = {
		clickBackwardButton : function(){
			$( '#visual-changes-forward-button' ).hide();
			$( '#visual-changes-backward-button' ).hide();// TEST: Call own API...
			visualChangesController.goToPreviousRevision();
		},
		clickForwardButton: function() {
			$( '#visual-changes-forward-button' ).hide();
			$( '#visual-changes-backward-button' ).hide();				
			visualChangesController.goToNextRevision();
		},
		clickSubmitTimesButton: function()
		{
			// get days and times from and to fields
			// send them to server
			var fromDate = $( '#vc-from-mediawiki-date' ).val();
			var fromHour = $( '#vc-from-hour-entry' ).val();
			var fromMinute = $( '#vc-from-minute-entry' ).val();
			var fromSecond = $( '#vc-from-second-entry' ).val();
			var fromTimeString = visualChangesUI.createTimeString( fromDate, 
																	fromHour, 
																	fromMinute, 
																	fromSecond );
			var toDate = $( '#vc-to-mediawiki-date' ).val();
			var toHour = $( '#vc-to-hour-entry' ).val();
			var toMinute =  $( '#vc-to-minute-entry' ).val();
			var toSecond = $( '#vc-to-second-entry' ).val();
			var toTimeString = visualChangesUI.createTimeString(toDate, 
																toHour, 
																toMinute, 
																toSecond);
			alert("from timestring:" + fromTimeString + "\n " +
				  "to timestring: " + toTimeString);
			  visualChangesController.diffTimes(fromTimeString, toTimeString);
		},
		createTimeString: function(dateString, hour, minute, second) {
			if (dateString.length == 8 && hour >= 0 && hour < 24
				&& minute >= 0 && minute < 60 && second >= 0 && second < 60) {
				return dateString + pad(hour, 2) + pad (minute, 2) + pad (second, 2);
			} else {  // something went wrong

				if (dateString.length != 8)
					return "datestring has wrong length: " + dateString + "" ;
				return "somethings wrong with the times :)//TODO";
			}
		},
		setBodyContent: function( newBodyContent )
		{
			mw.util.$content.html( newBodyContent );
		},
		setLogDivContent: function(newLogDivContent)
		{
			$("#logdiv").html(newLogDivContent);
		},
		initializeMenu: function()
		{
			// TODO(Robin): find better way/point/position to initialize the menu?
			var htmlMenu = '<div id="visual-changes-menu" class="visual-changes-menu-relative">\n\
								<div id = "visual-changes-datepickers"> \n\
									<div id = "visual-changes-fromdates">\n\
										<input type="text" value="2011" id="vc-from-date-entry"  class="visual-changes-date-entry"/>\n\
										<input type="number" value="0" id="vc-from-hour-entry" class = "visual-changes-time-entry"/>\n\
										<input type="number" value="0"id="vc-from-minute-entry" class = "visual-changes-time-entry"/>\n\
										<input type="number" value="0" id="vc-from-second-entry" class = "visual-changes-time-entry"/>\n\
									</div>\n\
									<input type="button" id="visual-changes-submittimes-button" value="Show Changes"></input> \n\
									<div id = "visual-changes-todates">\n\
										<input type="text" value="2011" id="vc-to-date-entry"  class = "visual-changes-date-entry"/>\n\
										<input type="number" value="0" id="vc-to-hour-entry" class = "visual-changes-time-entry"/>\n\
										<input type="number" value="0" id="vc-to-minute-entry" class = "visual-changes-time-entry"/>\n\
										<input type="number" value="0" id="vc-to-second-entry" class = "visual-changes-time-entry"/>\n\
									</div>\n\
								</div>\n\
								<a id="visual-changes-backward-button" href="#visualchanges">B</a>\n\
								<a id="visual-changes-forward-button" href="#visualchanges">F</a>\n\
								<input type="text" id="vc-from-mediawiki-date"  class = "visual-changes-mediawiki-date"/>\n\
								<input type="text" id="vc-to-mediawiki-date"  class = "visual-changes-mediawiki-date"/>\n\
							</div>'
				$( '#content' ).prepend(htmlMenu);
				// TODO(Robin): amke these into range datepickers see http://jqueryui.com/demos/datepicker/#date-range
				$( '#vc-from-date-entry' ).datepicker( {dateFormat: 'mm/dd/yy',
														altFormat: 'yymmdd',
														altField: '#vc-from-mediawiki-date'} );
				$( '#vc-to-date-entry' ).datepicker( {dateFormat: 'mm/dd/yy',
													  altFormat: 'yymmdd',
													  altField: '#vc-to-mediawiki-date'} );// If user scrolls below the position of
			// the visual-changes-menu, make the menu move to a fixed position on
			// the screen by changing the class (see ext.visualChanges.css
			// for styling)
			var visualChangesMenu = $( '#visual-changes-menu' );
			var offset = visualChangesMenu.offset();
			var topOffset = offset.top;

			$( window ).scroll( function() { 
					var scrollTop = $( window ).scrollTop();
					if ( scrollTop >= topOffset ) {
						if (visualChangesMenu.hasClass( 'visual-changes-menu-relative' ) ) {
						  visualChangesMenu.removeClass( 'visual-changes-menu-relative' );
						  visualChangesMenu.addClass( 'visual-changes-menu-fixed' );
						}
					}
					if ( scrollTop < topOffset ) {
							if (visualChangesMenu.hasClass( 'visual-changes-menu-fixed' ) ) {
								visualChangesMenu.removeClass( 'visual-changes-menu-fixed' );
								visualChangesMenu.addClass( 'visual-changes-menu-relative' );
							}
					}
				}
			);
		}
	}
	var visualChangesController =
	{
		goToPreviousRevision: function()
		{
			$.ajax({
						type: 'GET',
						url: mw.util.wikiScript( 'api' ),
						success: function(data) {
							visualChangesController.handleMergedWikiText(data);
						},
						dataType: 'json',
						async: true,
						data: {
							action: 'query',							
							prop: 'visualdiff',
							torev: visualChanges.fromRevisionId,
							format: 'json'
						}
			});
		},
		goToNextRevision: function() {
			$.ajax({
						type: 'GET',
						url: mw.util.wikiScript( 'api' ),
						success: function(data) {
							visualChangesController.handleMergedWikiText(data);
						},
						dataType: 'json',
						async: true,
						data: {
							action: 'query',							
							prop: 'visualdiff',
							fromrev: visualChanges.toRevisionId,
							format: 'json'
						}
			});
		},
		diffTimes: function(fromTime, toTime) {
			$.ajax({
						type: 'GET',
						url: mw.util.wikiScript( 'api' ),
						success: function(data) {
							visualChangesController.handleMergedWikiText(data);
						},
						dataType: 'json',
						async: true,
						data: {
							action: 'query',							
							prop: 'visualdiff',
							pageid: mw.config.get('wgArticleId'),
							fromtime: fromTime,
							totime: toTime,
							format: 'json'
						}
			});
		},
		handleMergedWikiText: function(json)
		{ 
			// PREPEND THE CONTENT TO THE BODY! :)
			$( '#visual-changes-backward-button' ).show();
			$( '#visual-changes-forward-button' ).show();
			var debugText = json.visualDiff.debugText;
			var htmlDiff = json.visualDiff.htmlDiff;
			visualChangesUI.setLogDivContent(debugText);
			visualChangesUI.setBodyContent(htmlDiff);
			visualChanges.fromRevisionId = json.visualDiff.fromrev;
			visualChanges.toRevisionId = json.visualDiff.torev;
		}
	}
	// TODO: make var visualChanges?
	// visualChanges is the main class holding all important informations
	visualChanges = {
		fromRevisionId : 0,
		toRevisionId : 0,
		getRevisionStartId: function() {
			var oldIdIndex = document.URL.indexOf('&oldid=');
			if (oldIdIndex != -1)
				return parseInt(document.URL.substr(oldIdIndex + 7));
			else
				return mw.config.get('wgCurRevisionId');
			}			
	};
	if (mw.config.get( 'wgAction' ) != 'view' || !mw.config.get( 'wgIsArticle' ) )
		return;

	visualChanges.fromRevisionId = visualChanges.getRevisionStartId();
	visualChanges.toRevisionId = visualChanges.getRevisionStartId();

	// initialize menu... 
	visualChangesUI.initializeMenu();

	// TODO: remove logdiv!
	$( '#bodyContent' ).after( '<div id="logdiv"></div>' );

	// add button click functions
	$( '#visual-changes-submittimes-button' ).click( visualChangesUI.clickSubmitTimesButton );
	$( '#visual-changes-forward-button' ).click( visualChangesUI.clickForwardButton );
	$( '#visual-changes-backward-button' ).click( visualChangesUI.clickBackwardButton );
});