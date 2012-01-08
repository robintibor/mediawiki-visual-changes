<?php
 /**
 * Diff Class for Visual Changes... TODO :)
 * @file
 * @author Robin Tibor Schirrmeister
 */
class VisualChangesDiff {
	public static $editsDebugString = "";
	public static function mergeWikiTexts( $fromWikiText, $toWikiText ) {
		self::$editsDebugString = "";
		$fromLines = explode("\n", $fromWikiText);
		$toLines = explode("\n", $toWikiText);
		// get the wikitext-diff between the two revisions
		$differenceEngine = new _DiffEngine();
		$edits = $differenceEngine->diff( $fromLines, $toLines );
		// merge wikitexts highlighting the changes with appropriate
		// <span class ="vc_deletion"> (for deletion),
		// <span class="vc_addition> (for addition) and <span class ="vc_change"> 
		// (for changed words) tags
		self::$editsDebugString = self::editsToDebugString( $edits );
		$mergedWikiText = self::mergeEdits( $edits );
		return $mergedWikiText;
	}
	/* Merges Edits into one new wikitext
	 * return that wikitext
	 * Surrounds deletions by <span class="vc_deletion"> tags and 
	 * insertions by <span class="vc_addition"> tags...
	 * TODO: change to span class= deletion span class = addition :)
	 */
	private static function mergeEdits(/* _Diff_Op array */ $edits) {
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
						$mergedRevisions .= '<span class="vc_deletion">' . "\n" .
											implode( "\n</span><span class=\"vc_deletion\">" , 
													$currentEdit->orig ) . "\n" . 
											'</span>' ;
					}
					else if ( $editType === 'add' ){						
						$mergedRevisions .= '<span class="vc_addition">' . "\n" .
											implode( "\n</span><span class=\"vc_addition\">" , 
													$currentEdit->closing ) . "\n" . 
											'</span>' ;
					}
					else if ( $editType === 'change' ){						
						$mergedRevisions .= '<span class="vc_deletion">' . "\n" .
											implode( "\n</span><span class=\"vc_deletion\">" , 
													$currentEdit->orig ) . "\n" . 
											'</span>' ;
						$mergedRevisions .= "\n";						
						$mergedRevisions .= '<span class="vc_addition">' . "\n" .
											implode( "\n</span><span class=\"vc_addition\">\n" , 
													$currentEdit->closing ) . "\n" . 
											'</span>' ;
					}
					else {
						wfDebug('unknown Edit type when merging edits: ' . $editType);
					}
				}
				return $mergedRevisions;
	}
	
	// String representation of edits for debugging
	private static function editsToDebugString( /* _DIFF_OP array */ $edits )	{
		$editString = "Editsize: " . count( $edits ) . "<br />";
		for ( $i = 0; $i < count( $edits ); $i++ )
		{
			$editType = $edits[ $i ]->type;
			$editString .= $editType . "<br />";
			if ($editType === 'delete' || $editType === 'copy' || $editType === 'change' )
				$editString .= "original (" .$edits[ $i ]->norig() . "): " .
							   implode( $edits[ $i ]->orig ) . "<br />";
			if ($editType === 'add' || $editType === 'change')
				$editString .= "closing (" .$edits[ $i ]->nclosing() . "): " .
							   implode( $edits[ $i ]->closing ). " <br />";
		}
		return $editString;
	}

}
?>
