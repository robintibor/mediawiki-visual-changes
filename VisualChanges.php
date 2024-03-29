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
$wgAutoloadLocalClasses['VisualChangesDiff'] = "$dir/VisualChangesDiff.php";
$wgAutoloadLocalClasses['VisualChangesHooks'] = "$dir/VisualChangesHooks.php";
$wgAutoloadLocalClasses['ApiVisualChangesDiff'] = "$dir/api/ApiVisualChangesDiff.php";
require_once ("$dir/htmlDiff/htmldiff.php");
// TODO(Robin): find out if you can autoload classes from htmldiff isntead

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
 // javascript tests
$wgHooks['ResourceLoaderTestModules'][] = 'VisualChangesHooks::addJavaScriptTests';
// Adding two modules, seperated startup module (init) from rest
// to makt it easier testable (dont know if this is smart :))
// Resource loader Information
$commonModuleInfo = array(
	'localBasePath' => dirname( __FILE__ ) . '/resources',
	'remoteExtPath' => 'VisualChanges/resources',
);

$wgResourceModules['ext.visualChanges'] = array(
	'scripts' => array('ext.visualChanges.UI.js', 'ext.visualChanges.js'),
	'styles' => 'ext.visualChanges.css',
	'messages' => array(
	),
	'dependencies' => array( 'jquery.ui.datepicker'
	),
) + $commonModuleInfo;

// the init module adds the html menu etc.
$wgResourceModules['ext.visualChanges.init'] = array(
	'scripts' => array('ext.visualChanges.init.js'),
	'styles' => 'ext.visualChanges.css',
	'messages' => array(
	),
	'dependencies' => array( 'ext.visualChanges'
	),
) + $commonModuleInfo;

?>
