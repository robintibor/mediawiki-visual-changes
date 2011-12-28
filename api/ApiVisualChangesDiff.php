<?php

class ApiVisualChangesDiff extends ApiQueryBase {


	public function __construct( $query, $moduleName ) {
		parent::__construct( $query, $moduleName);
	}

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
		global $wgParser, $wgTitle, $wgLang;
		// get the two revisions
		$revisionFromId = $this->getParameter('revfrom');
		$revisionToId = $this->getParameter('revto');
		$revisionFrom = Revision::newFromId($revisionFromId);
		$revisionTo = Revision::newFromId($revisionToId);
		$fromWikiText = $revisionFrom->getText();
		$toWikiText = $revisionTo->getText();
		$fromLines = explode("\n", $fromWikiText);
		$toLines = explode("\n", $toWikiText);
		// get the wikitext-diff between the two revisions
		$differenceEngine = new _DiffEngine();
		$edits = $differenceEngine->diff( $fromLines, $toLines );

		// add special words to old wikitext
		$editsDebugString = $this->editsToDebugString( $edits );
		$mergedWikiText = $this->mergeEdits( $edits );
		$parserOptions = new ParserOptions();
		$dummyTitle = $revisionFrom->getTitle();
		// parse wikitext
		$parserOutput = $wgParser->parse( $mergedWikiText, $dummyTitle, $parserOptions );
		$parsedWikiText = $parserOutput->getText();
		// replace special words by colors etc
		// return new html for page content mwcontentltr
		$this->getResult()->addValue( null, 'visualDiff',
						array( 'debugText' => 'fromText:'  .$fromWikiText .
									'toText:' .	$toWikiText . "<br />" . "mergedText" .
							$mergedWikiText .
							$editsDebugString,
							'parsedMergedRevisions' => $parsedWikiText) );
	}
	
	/* Merges Edits into one new wikitext
	 * return that wikitext
	 * Surrounds deletions by <del> tags and insertions by <ins> tags...
	 */
	public function mergeEdits(/* _Diff_Op array */ $edits) {
				$mergedRevisions = "";
				for ( $i = 0; $i < count( $edits ); $i++ ) {
					if ( $i > 0 )
						$mergedRevisions .= "\n";
					$currentEdit = $edits[ $i ];
					$editType = $currentEdit->type;
					if ( $editType === 'copy'){
						$mergedRevisions .= implode( "\n" , $currentEdit->orig );
					}
					else if ( $editType === 'delete' ) {						
						$mergedRevisions .= '<del>' . "\n" .
											implode( "\n" , $currentEdit->orig ) . "\n" . 
											'</del>' ;
					}
					else if ( $editType === 'add' ){						
						$mergedRevisions .= '<ins>' . "\n" .
											implode( "\n" , $currentEdit->closing ) . "\n" . 
											'</ins>' ;
					}
					else if ( $editType === 'change' ){						
						$mergedRevisions .= '<del>' . "\n" .
											implode( "\n" , $currentEdit->orig ) . "\n" . 
											'</del>' ;
						$mergedRevisions .= "\n";
						$mergedRevisions .= '<ins>' . "\n" .
											implode( "\n" , $currentEdit->closing ) . "\n" . 
											'</ins>';
					}
					else {
						wfDebug('unknown Edit type when merging edits: ' . $editType);
					}
				}
				return $mergedRevisions;
	}
	// String representation of edits for debugging
	public function editsToDebugString( /* _DIFF_OP array */ $edits )	{
		$editString = "Editsize: " . count( $edits ) . "<br />";
		for ( $i = 0; $i < count( $edits ); $i++ )
		{
			$editString .= $edits[ $i ]->type . "<br />";
			$editString .= "original (" .$edits[ $i ]->norig() . "): " .
						   implode( $edits[ $i ]->orig ) . "<br />";
			$editString .= "closing (" .$edits[ $i ]->nclosing() . "): " .
						   implode( $edits[ $i ]->closing ). " <br />";
		}
		return $editString;
	}
	// remaining here for possible future use: WARNING INCOMPLETE CODE!!
	// possibly use this for liens that changed? to merge the diff of just one
	// line? but also check other existing functions first...
		// Merge the diffs to get a new wikitext with special characters inserted
	// to mark the changes (additions, deletions, swaps
	// public function mergeDiffs( /* char array */ $originalLines,
	//							/* char array */$newLines, 
	//							/* boolean array */ $added,
	//							/* boolean array */ $removed)
	/*{
		$deletedKeyword = 
		// partly copied from _DiffEngine->diff() function
		// Compute the edit operations.
		$originalLength = sizeof( $originalLines );
		$newLength = sizeof( $newLines );

		$newWikiText = "";
		$edits = array();
		$originalIndex = $newIndex = 0;
		while ( $originalIndex < $originalLength || $newIndex < $newLength ) {
			assert( $newLength < $newIndex || $added[$newIndex] );
			assert( $originalIndex < $originalLength || $removed[$originalIndex] );

			// Add parts that are the same in both texts...
			while ( $originalIndex < $originalLength && $newIndex < $newLength
			&& !$removed[$originalIndex] && !$added[$newIndex] ) {
				// chars should be the same
				assert($originalLines[$originalIndex] == $newLines[$newIndex]);
				$originalIndex++;
				$newIndex++;
			}
			$deletedPart = "";
			while ( $originalIndex < $originalLength && $removed[$originalIndex] ) {
				$deletedPart .= $originalLines[$originalIndex];
				$originalIndex++;
			}
			$add = array();
			while ( $yi < $n_to && $this->ychanged[$yi] )  {
				$add[] = $to_lines[$yi++];
			}

			if ( $delete && $add ) {
				$edits[] = new _DiffOp_Change( $delete, $add );
			} elseif ( $delete ) {
				$edits[] = new _DiffOp_Delete( $delete );
			} elseif ( $add ) {
				$edits[] = new _DiffOp_Add( $add );
			}
		}
	}*/
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
			'revfrom' => array(
				ApiBase::PARAM_REQUIRED => true,
				ApiBase::PARAM_TYPE => 'integer'
			),
			'revto' => array(
				ApiBase::PARAM_REQUIRED => true,
				ApiBase::PARAM_TYPE => 'integer'
			)
		);
	}
}

?>
