<?php

/**
 * Functions attached to MediaWiki Hooks
 *
 * @file
 */

class VisualChangesHooks {

	/**
	 * Adds the module to the page,
         * Function is added to Hook: BeforePageDisplay
	 *
	 * @param out OutputPage
	 * @param $parseroutput TODO
	 */
    public static function addVisualChangeModule( &$out, &$sk ) {
        $out->addModules( 'ext.visualChanges' );
        return true;
    }
	public static function addJavaScriptTests( &$testModules, &$rssourceLoader ) {
		
	}
}
?>
