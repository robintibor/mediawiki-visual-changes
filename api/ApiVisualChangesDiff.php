<?php

class ApiVisualChangesDiff extends ApiQueryBase {


	public function __construct( $query, $moduleName ) {
		parent::__construct( $query, $moduleName);
	}
	static $debugText = "";
	/**
	 * Get the revisions requested and return a html string 
	 * visualizing the changes inbetween them
	 * Evaluates the parameters, performs the requested query, and sets up
	 * the result. Concrete implementations of ApiBase must override this
	 * method to provide whatever functionality their module offers.
	 * Implementations must not produce any output on their own and are not
	 * expected to handle any errors.
	 *
	 * The execute() method will be invoked directly by ApiMain immediately
	 * before the result of the module is output. Aside from the
	 * constructor, implementations should assume that no other methods
	 * will be called externally on the module before the result is
	 * processed.
	 *
	 * The result data should be stored in the ApiResult object available
	 * through getResult().
	 */
	public function execute() {
		self::$debugText = "";
		global $wgParser;
		// Get the two revisions
		$requestParams = $this->extractRequestParams();
		$revisionFrom;
		$revisionTo;
		// TODO(Robin): create stepbackwards parameter instead of just defaulting to one revision
		// before or after?
		if ( isset ( $requestParams[ 'fromrev' ] ) || isset ( $requestParams[ 'torev' ] ) ) {
			// Get the the revision to diff to and the division to diff from
			// if the from id is not given use previous revision of revision to diff to
			// if to id is not given use next revision of revision to diff from
			if ( isset($requestParams[ 'fromrev' ] ) )
				$revisionFrom =  Revision::newFromId( $requestParams[ 'fromrev' ] );
			if ( isset($requestParams[ 'torev' ] ) )
				$revisionTo =  Revision::newFromId( $requestParams[ 'torev' ] );
			if ( !isset($requestParams[ 'fromrev' ] ) )
				$revisionFrom = $revisionTo->getPrevious();	
			if ( !isset($requestParams[ 'torev' ] ) )
				$revisionTo = $revisionFrom->getNext();
			if ($revisionFrom == null)
				$revisionFrom = $revisionTo;
			else if ($revisionTo == null)
				$revisionTo = $revisionFrom;
			} else if ( isset( $requestParams[ 'pageid' ] ) ) {
			// Get the revisions by the time to diff from and the time to diff to
			// or use the newest revision as the revision to diff to
			// if time to diff to is not given
			$pageId = $requestParams[ 'pageid' ];
			// TODO(Robin): check for existence of given page id
			$testTitle = Title::newFromID($pageId);
			if ($testTitle == null)
				$this->dieUsage("page id doesnt exist: $pageId", 'pageid-doesnt-exist');
			if ( isset( $requestParams[ 'fromtime' ] ) && isset( $requestParams[ 'totime' ] )) {
				$revisionFrom = $this->getNewestRevisionBefore( $pageId, $requestParams[ 'fromtime' ] );
				$revisionTo = $this->getNewestRevisionBefore( $pageId, $requestParams[ 'totime' ] );
			} else {
				if (!isset( $requestParams[ 'fromtime' ] ) )
					$this->dieUsage( 'page id given but fromtime parameter missing', 'fromtime-missing' );
				if (!isset( $requestParams[ 'totime' ] ) )
					$this->dieUsage( 'page id given but totime parameter missing', 'totime-missing' );			
			}
		} else { 
			$this->dieUsage("Neither torev not fromrev nor pageid parameter given...", 
							"fromrev-or-torev-or-pageid-missing");
		}
		$pageId = $revisionTo->getPage();
		$fromWikiText = $revisionFrom->getText();
		$toWikiText = $revisionTo->getText();
		$fromTitle = $revisionFrom->getTitle();
        $htmlDiff = self::getHtmlDiff( $fromWikiText, $toWikiText,
													$fromTitle );
		self::addToDebugText('fromText:'  .$fromWikiText .
							'toText:' .	$toWikiText . "<br />" . "mergedText" .
							$mergedWikiText .
							VisualChangesDiff::$editsDebugString);
		// return new html for page content mwcontentltr
		$this->getResult()->addValue( null, 'visualDiff',
						array( 'debugText' => self::$debugText,
							'fromrev' => $revisionFrom->getId(),
							'torev' => $revisionTo->getId(),
							'htmlDiff' => $htmlDiff ) );
	}

	public function getNewestRevisionBefore( $pageId, $timeStamp ) {
		$this->resetQueryParams();
		// make sure we get any result by checking revision time is not to early
		$earliestRevisionTime = Title::newFromID( $pageId )->getEarliestRevTime();
		if ( $timeStamp < $earliestRevisionTime )
			$timeStamp = $earliestRevisionTime;
		// query the revision table for oldest revision of given page
		// since given time stamp ...
		$this->addTables( 'revision' );
		$this->addFields( '*' );
		$sort = false;   // we need to sort by rev_timestamp descending :)
		$this->addWhereFld('rev_page', $pageId);
		$start = $timeStamp;
		$end = null;
		$this->addTimestampWhereRange( 'rev_timestamp', 'older', $start, $end,
									   $sort );
		$this->addOption( 'ORDER BY', 'rev_timestamp DESC' );
		$this->addOption( 'LIMIT', 1 );
		$queryResult = $this->select( __METHOD__ );
		assert ( $queryResult->numRows() == 1 );
		return Revision::newFromRow ( $queryResult->current() );
	}

	private static function addToDebugText( $string ) {
		self::$debugText .= $string;
	}

	public static function getHtmlDiff( $fromWikiText, $toWikiText, 
										/*Title*/ $wikiTitle ) {
		global $wgParser;
		$parserOptions = new ParserOptions();
		// parse wikitext
		$parserOutput = $wgParser->parse( $fromWikiText, $wikiTitle, $parserOptions );
		$fromHtml = $parserOutput->getText();
		$parserOutput = $wgParser->parse( $toWikiText, $wikiTitle, $parserOptions );
		$toHtml = $parserOutput->getText();
		return html_diff($fromHtml, $toHtml);
	}

	/**
	 * Returns a string that identifies the version of the extending class.
	 * Typically includes the class name, the svn revision, timestamp, and
	 * last author. Usually done with SVN's Id keyword
	 * @return string
	 */
	public function getVersion() {
		return __CLASS__ . '0001';
	}
        
    
    protected function getAllowedParams() {
		return array(
			'torev' => array(
				ApiBase::PARAM_REQUIRED => false,
				ApiBase::PARAM_TYPE => 'integer'
			),
			'fromrev' => array(
				ApiBase::PARAM_REQUIRED => false,
				ApiBase::PARAM_TYPE => 'integer'
			),
			'pageid' => array( // TODO: rename as articleid?
				ApiBase::PARAM_REQUIRED => false,
				ApiBase::PARAM_TYPE => 'integer'
			),
			'totime' => array(
				ApiBase::PARAM_REQUIRED => false,
				ApiBase::PARAM_TYPE => 'string'
			),
			'fromtime' => array(
				ApiBase::PARAM_REQUIRED => false,
				ApiBase::PARAM_TYPE => 'string'
			)
			
		);
	}
}

?>
