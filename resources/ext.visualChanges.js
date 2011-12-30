// from http://stackoverflow.com/questions/2419749/get-selected-elements-outer-html/4180972#4180972
(function($) {
  $.fn.outerHtml = function() {
    return $(this).clone().wrap('<div></div>').parent().html();
  }
})(jQuery);
 
(function ( $ ) {
    /* @TODO: check how to add portlet links?
mw.util.addPortletLink('p-tb', 'http://mediawiki.org/', 'MediaWiki.org');*/
 
		
		// functions for the buttons...
		var visualChangesUI = {
			clickBackwardButton : function(){
				$( '#visual-changes-forward-button' ).hide();
				$( '#visual-changes-backward-button' ).hide();// TEST: Call own API...
				$.ajax({
                            type: 'GET',
                            url: mw.util.wikiScript( 'api' ),
                            success: function(data) {
								// PREPEND THE CONTENT TO THE BODY! :)
								$( '#visual-changes-backward-button' ).show();
								$( '#visual-changes-forward-button' ).show();
								visualChangesController.handleMergedWikiText(data);
                            },
                            dataType: 'json',
                            async: true,
                            data: {
								action: 'query',							
								prop: 'visualdiff',
								pageid: mw.config.get('wgArticleId'),
								fromtime: '20111023000000',
								format: 'json'
                            }
                });
			},
			clickForwardButton: function() {
				$( '#visual-changes-forward-button' ).hide();
				$( '#visual-changes-backward-button' ).hide();				
			},
			clickSubmitTimesButton: function()
			{
				// get days and times from and to fields
				// send them to server
				var toDate = $( '#vc-from-date-entry' ).attr('value');
				var toHour = $( '#vc-from-hour-entry' ).attr('value');
				var toMinute = $( '#vc-from-minute-entry' ).attr('value');
				var toSecond = $( '#vc-from-second-entry' ).attr('value');
				alert("to timestring: " + toDate + toHour + toMinute + toSecond);
			},
			setBodyContent: function( newBodyContent )
			{
				mw.util.$content.html( newBodyContent );
			},
			setLogDivContent: function(newLogDivContent)
			{
				$("#logdiv").html(newLogDivContent);
			}
		}
		var visualChangesController =
		{
			goToNextRevision: function()
			{
				
			},
			handleMergedWikiText: function(json)
			{ 
				var debugText = json.visualDiff.debugText;
				var parsedMergedRevisions = json.visualDiff.parsedMergedRevisions;
				visualChangesUI.setLogDivContent(debugText);
				visualChangesUI.setBodyContent(parsedMergedRevisions)
			}
		}
		// TODO: make var visualChanges?
        // visualChanges is the main class holding all important informations
        visualChanges = {
			article: {
				articleId : mw.config.get('wgArticleId'),
				// revisions variable storing actual revisions with wikitext
				// parsed comments, etc.
				revisionTexts: {},
				// revisionList is only storing ids of the revisions
				revisionInfos: []
			},
			currentRevisionId : 0,
			currentRevisionToDiffToId : 0,
			getRevisionStartId: function() {
				var oldIdIndex = document.URL.indexOf('&oldid=');
				if (oldIdIndex != -1)
					return parseInt(document.URL.substr(oldIdIndex + 7));
				else
					return mw.config.get('wgCurRevisionId');
				},
			goToPreviousRevision: function() {
				// first check if revisionId is present
				if ( this.article.revisionInfos.length < this.currentRevision + 2 ) {
					var extraRevisionsToGet = 20;
					this.getRevisionInfosAndTextAndShowDiff( this.currentRevision + 1,
						extraRevisionsToGet );	
				} else {
					var toRevNr = this.currentRevision + 1;
					// check if from id present
					var fromRevId = this.article.revisionInfos[ this.currentRevision ].revid;
					var toRevId = this.article.revisionInfos[ toRevNr ].revid;
					this.getRevisionTextsAndShowDiff( fromRevId, toRevId, toRevNr );
				}
			},
			goToNextRevision: function() {
				// first check if revisionId is present
				if ( this.currentRevision < 1) {
					alert('going back revisions beyond initial revision not supported yet');
					$( '#visual-changes-backward-button' ).show();
					return;
				} else {
					var toRevNr = this.currentRevision - 1;
					// check if from id present
					var fromRevId = this.article.revisionInfos[ this.currentRevision ].revid;
					var toRevId = this.article.revisionInfos[ toRevNr ].revid;
					this.getRevisionTextsAndShowDiff( fromRevId, toRevId, toRevNr );
				}
			}
	};
        if (mw.config.get( 'wgAction' ) != 'view' || !mw.config.get( 'wgIsArticle' ) )
            return;
		visualChanges.currentRevisionId = visualChanges.getRevisionStartId();
		visualChanges.currentRevisionToDiffToId = visualChanges.getRevisionStartId();
        // initialize menu... 
		// TODO(RObin): find better way/point/position to initialize the menu?
		var htmlMenu = '<div id="visual-changes-menu" class="visual-changes-menu-relative">\n\
							<div id = "visual-changes-datepickers"> \n\
								<div id = "visual-changes-fromdates">\n\
									<input type="text" id="vc-from-date-entry"  class="visual-changes-date-entry"/>\n\
									<input type="number" value="0" id="vc-from-hour-entry" class = "visual-changes-time-entry"/>\n\
									<input type="number" value="0"id="vc-from-minute-entry" class = "visual-changes-time-entry"/>\n\
									<input type="number" value="0" id="vc-from-second-entry" class = "visual-changes-time-entry"/>\n\
								</div>\n\
								<input type="button" id="visual-changes-submittimes-button" value="Show Changes"></input> \n\
								<div id = "visual-changes-todates">\n\
									<input type="text" id="vc-to-date-entry"  class = "visual-changes-date-entry"/>\n\
									<input type="number" value="0" id="vc-to-hour-entry" class = "visual-changes-time-entry"/>\n\
									<input type="number" value="0" id="vc-to-minute-entry" class = "visual-changes-time-entry"/>\n\
									<input type="number" value="0" id="vc-to-second-entry" class = "visual-changes-time-entry"/>\n\
								</div>\n\
							</div>\n\
							<a id="visual-changes-backward-button" href="#">B</a>\n\
							<a id="visual-changes-forward-button" href="#">F</a>\n\
						</div>'
        $( '#content' ).prepend(htmlMenu);
		// TODO: remove logdiv!
        $( '#bodyContent' ).after( '<div id="logdiv"></div>' );
        // If user scrolls below the position of
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
		//mw.loader.load('ui.slider');
		//$('#logdiv').slider();
        // add button click functions
        $( '#visual-changes-submittimes-button' ).click( visualChangesUI.clickSubmitTimesButton );
        $( '#visual-changes-forward-button' ).click( visualChangesUI.clickForwardButton );
        $( '#visual-changes-backward-button' ).click( visualChangesUI.clickBackwardButton );
})( jQuery )