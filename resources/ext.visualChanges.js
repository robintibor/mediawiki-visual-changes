// from http://stackoverflow.com/questions/2419749/get-selected-elements-outer-html/4180972#4180972
(function($) {
  $.fn.outerHtml = function() {
    return $(this).clone().wrap('<div></div>').parent().html();
  }
})(jQuery);

jQuery( document ).ready(function ( $ ) {
	visualChangesController =
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
			//$( '#visual-changes-backward-button' ).show();
			//$( '#visual-changes-forward-button' ).show();
			var debugText = json.visualDiff.debugText;
			var htmlDiff = json.visualDiff.htmlDiff;
			visualChangesUI.setLogDivContent(debugText);
			visualChangesUI.setBodyContent(htmlDiff);
			visualChanges.fromRevisionId = json.visualDiff.fromrev;
			visualChanges.toRevisionId = json.visualDiff.torev;
		}
	}
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
});