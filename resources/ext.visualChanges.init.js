
jQuery( document ).ready(function ( $ ) {
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