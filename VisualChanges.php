<?php
 /**
 * VisualChanges - Visualizing the changes inbetween revisions
 *                 of an article
 *                 Program Structure based on Live Edit by John Du Hart
 * @file
 * @author Robin Tibor Schirrmeister
 */

$wgExtensionCredits['other'][] = array(
	'path' => __FILE__,
	'name' => 'VisualChanges',
	'url' => 'TODO!',
	'author' => 'Robin Tibor Schirrmeister',
	'descriptionmsg' => 'visualchanges-desc',
);

/*
 * Init!
 */
$dir = dirname( __FILE__ );

// Messages File for internationalization
$wgExtensionMessagesFiles['VisualChanges'] = "$dir/VisualChanges.i18n.php";

// Autoload necessary classes
$wgAutoloadLocalClasses['VisualChangesHooks'] = "$dir/VisualChangesHooks.php";
$wgAutoloadLocalClasses['ApiVisualChangesDiff'] = "$dir/api/ApiVisualChangesDiff.php";

// Set Hooks
$wgHooks['BeforePageDisplay'][] = 'VisualChangesHooks::addVisualChangeModule';

// API
$wgAPIPropModules['visualdiff'] = 'ApiVisualChangesDiff';

// TESTS
$wgHooks['UnitTestsList'][] = 'visualChangesRegisterUnitTests';
function visualChangesRegisterUnitTests( &$files ) {
        $testDir = dirname( __FILE__ ) . '/';
        $files[] = $testDir . 'api/ApiVisualChangesDiffTest.php';
        return true;
}
// @TODO check if this is necessary, i.e. if there are other modules,
// that will be added...
// Resource loader Information
$commonModuleInfo = array(
	'localBasePath' => dirname( __FILE__ ) . '/resources',
	'remoteExtPath' => 'VisualChanges/resources',
);

$wgResourceModules['ext.visualChanges'] = array(
	'scripts' => 'ext.visualChanges.js',
	'styles' => 'ext.visualChanges.css',
	'messages' => array(
	),
	'dependencies' => array(
	),
) + $commonModuleInfo;


?>
