// from http://stackoverflow.com/questions/2419749/get-selected-elements-outer-html/4180972#4180972
(function($) {
  $.fn.outerHtml = function() {
    return $(this).clone().wrap('<div></div>').parent().html();
  }
})(jQuery);
 
(function ( $ ) {
    /* @TODO: check how to add portlet links?
    alert(mw.config.get('wgTitle'));
mw.util.addPortletLink('p-tb', 'http://mediawiki.org/', 'MediaWiki.org');*/
 
        // for merging later on, specify keywords to mark deletions and additions
        // in the wikitext...
        var addedKeyword = "_vc__add_";
        var endAddedKeyword = "_vc__endadd_";
        var deletedKeyword = "_vc__delete_";
        var endDeletedKeyword = "_vc__enddelete_";
		
		// functions for the buttons...
		var visualChangesUI = {
			clickBackwardButton : function(){
				$( '#visual-changes-forward-button' ).hide();
				$( '#visual-changes-backward-button' ).hide();
				visualChanges.goToPreviousRevision();
			},
			clickForwardButton: function() {
				$( '#visual-changes-forward-button' ).hide();
				$( '#visual-changes-backward-button' ).hide();
				// TEST: Call own API...
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
								revfrom: '27',
								revto: '26',
								format: 'json'
                            }
                });
			},
			setBodyContent: function(newBodyContent)
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
				alert(debugText);
			}
		}

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
			currentRevision : 0,
			currentRevisionToDiffTo : 0,
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
        // initialize menu...
        $( '#content' ).prepend(mw.html.element('div', 
                        {id: 'visual-changes-menu',
                        'class': 'visual-changes-menu-relative'},
                        new mw.html.Raw(
                        mw.html.element( 'a',
                                    {id: 'visual-changes-backward-button',
                                      href: '#visualchanges'}, 'B' ) +
                          mw.html.element( 'a',
                                {id: 'visual-changes-forward-button',
                                  href: '#visualchanges'}, 'F' ) ) ) );
                              // TODO: remove logtable and logdiv!
            $( '#bodyContent' ).after( '<table id="logtable"><tr> <td colspan = "2" id="queryanswer"></td>' + 
                                    '<tr><td id="wikitext">Wikitext:</td><td id="oldwikitext">old Wikitext</td></tr>' +
                                 '<tr><td colspan = "2" id="diff">diff</td></tr>' +
                                 '<tr><td colspan = "2" id="mergeddiff">mergeddiff</td></tr></table>' );
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
        // add button click functions
        $( '#visual-changes-forward-button' ).click( visualChangesUI.clickForwardButton );
        $( '#visual-changes-backward-button' ).click( visualChangesUI.clickBackwardButton );
})( jQuery )