<?php

/**
 * Functions attached to MediaWiki Hooks
 *
 * @file
 */

class VisualChangesHooks {

	/**
	 * Adds the module to the page,
         * Function is added to Hook: OutputPageParserOutput
	 *
	 * @param out OutputPage
	 * @param $parseroutput TODO
	 */
    public static function addJavaScriptModule( &$out, &$sk ) {
        $out->addModules( 'ext.visualChanges' );
        return true;
    }

	/**
	 * Adds the module to the page,
         * Function is added to Hook: ArticleViewHeader
	 *
	 * @param $article Article
	 * @param $outputDone bool
	 * @param $pcache string
	 */
    public static function addHeaderButtons( &$article, &$outputDone, &$pcache ) {
        /*$article->getContext()->getOutput()->prependHTML( Html::rawElement( 'div' ,
                        array( 'id' => 'visual-changes-menu2',
                               'class' => 'visual-changes-menu-relative'),  // for css
                        Html::element( 'a' , 
                                array( 'id' => 'visual-changes-backward-button2',
                                       'href' => '#visualchanges'), 'Bs'
                                 ) .
                        Html::element( 'a' , 
                                array( 'id' => 'visual-changes-forward-button2',
                                       'href' => '#visualchanges'), 'F') ) );*/
        return true;
    }
}
?>
