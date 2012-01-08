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
        $out->addModules( 'ext.visualChanges.init' );
        return true;
    }
	public static function addJavaScriptTests( &$testModules, &$resourceLoader ) {
		$testModules['qunit']['ext.visualChanges.tests'] = array(
        'script' => array( 'tests/ext.visualChanges.test.js' ),
        'dependencies' => array( 'ext.visualChanges' ),
		'localBasePath' => dirname( __FILE__ ) . '/resources',
		'remoteExtPath' => 'VisualChanges/resources',
		);
		return true;
	}
}
?>
