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
                            },
                            dataType: 'json',
                            async: true,
                            data: {
								action: 'query',							
								prop: 'visualdiff',
								revfrom: '1',
								revto: '3',
								format: 'json'
                            }
                });
				visualChanges.goToNextRevision();
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
			// helper object for the parsing
			parseHelper: {
				mergeDiff: function( fromWikiText, toWikiText, 
				diffWikiText ) {
					
                var fromLines = fromWikiText.split(/\r?\n/);
                var toLines = toWikiText.split(/\r?\n/);
				// make a real table out of it for safety
				// TODO(Robin): check if this is necessary...
                var diffDOM = $('<table>' + diffWikiText + '</table>');
                var mergedDiffs = '';
                var currentLine = 0;
                $.each($('.diff-lineno', diffDOM), 
                    function(index, value) {
                        // get the line number of the next change,
                        // subtract -1 for zerobased index..
                        var lineNumber = parseInt(value.innerHTML.substr(5)) - 1;
                        // check if we already dealt with this line number
						// (will happen because line numbers can appear twice
						// in the diff)
                        if (currentLine > lineNumber)
                            return;
						// ok now we have a real diff-change, lets look for
						// the changes until we find the next diff-change
						// or we are at the end of the table..
						
						// the diff changes for each line
						// should always be in one table-row
                        var tableRow = $(value).parent()[0];
						foundNextDiffOrEndOfTable = false;
                        var diffCell;
						while ( !foundNextDiffOrEndOfTable ) {
							// count context lines, those lines
							// that didn't change..... 
							var linesInBetween = 0;	
							foundChangeLine = false;
							while ( !( foundChangeLine || foundNextDiffOrEndOfTable ) )
							{
								// the next sibling of the table row 
								// should be the one containing the next change
								// or the next context line of the diff
								tableRow = $(tableRow).next()[0];
								if ( typeof tableRow === 'undefined' ){
									foundNextDiffOrEndOfTable = true;
									break;
								}
								// go through the child nodes of the table
								// see if you find a cell indicating
								// a deletion, an addition, or a new diff-change
								var childrenOfRow = $(tableRow).children();
								for ( var i = 0; i < childrenOfRow.length; i++ ) {     
									diffCell = childrenOfRow[i];
									if ( diffCell.className == 'diff-addedline' || 
										diffCell.className == 'diff-deletedline') {
										foundChangeLine = true;
										break;
										} else if ( diffCell.className == 'diff-lineno' ){
											foundNextDiffOrEndOfTable = true;
											break;
										}
								}
								if (!foundChangeLine) lineNumber++;
							}
							// check if we have a new diff
							if ( foundNextDiffOrEndOfTable )
								break;
							// add those lines that /didnt change to the merged
							// diff
							linesInBetween = lineNumber - currentLine;
							mergedDiffs += fromLines.slice(currentLine, currentLine + linesInBetween).join('\n');
							mergedDiffs += '\n';
							// now check if we have only one change (addition or
							// deletion) or both!
							if ( childrenOfRow.length == 3 ) { 
								// only addition or deletion, just 
								// add the corresponding line with an add or delete
								// marker to the merged diff
								if ( diffCell.className == 'diff-addedline' )
									mergedDiffs += addedKeyword + toLines[ lineNumber ] + 
												   endAddedKeyword + '\n';
								else if ( diffCell.className == 'diff-deletedline' )
									mergedDiffs += deletedKeyword + fromLines[ lineNumber ] + 
												   endDeletedKeyword + '\n';
							} else {  // now merge line with additions and deletions...
								var deletedLine = $('div', childrenOfRow[ 1 ]);
								var addedLine = $('div', childrenOfRow [ 3 ]);
								var mergedLine = visualChanges.parseHelper.mergeDiffLine( deletedLine, addedLine );
								mergedDiffs += mergedLine;
							}
							lineNumber++;
							mergedDiffs += '\n';
							currentLine = lineNumber;
						}
					});
                // remaining text is the same...
				if ( fromLines.length > currentLine )
					mergedDiffs += fromLines.slice( currentLine ).join( '\n' )+ '\n';
				mergedDiffs = this.cleanMergedText(mergedDiffs);
				return mergedDiffs;
				},
				/**
				 * merge a line with additions and a line with deletions
				 * into one line for a merged diff
				 * 
				 * @param deletedLine line with deletions
				 * @param addedLine line with additions
				 */
				mergeDiffLine: function( deletedLine, addedLine ) {
					// Merge one line, just always go through both
					// lines in parallel, always inserting in parallel as well
					var mergedLine = "";
					var deletePositionInOldWikiText = 0;
					var addPositionInOldWikiText = 0;
					var mergedPositionInOldWikiText = 0;
					var nextAddPosition = 0;
					var nextDeletePosition = 0;
					var deleteNodeIndex = 0;
					var addNodeIndex = 0;
					var deleteNodes = deletedLine.contents();
					var addNodes = addedLine.contents();
					var parsedLine = false;
					var deleteNode;
					var addNode;
					var charsToAdd;
					while ( !parsedLine ) {
						if ( deleteNodeIndex < deleteNodes.length )
							deleteNode = deleteNodes[ deleteNodeIndex ];
						if ( addNodeIndex < addNodes.length )
							addNode = addNodes[ addNodeIndex ];
						if( deleteNodeIndex < deleteNodes.length &&
							deleteNode.nodeType == Node.TEXT_NODE ){
							nextDeletePosition = deletePositionInOldWikiText + 
								deleteNode.data.length;
						} else {
							nextDeletePosition = deletePositionInOldWikiText;
						}
						if ( addNodeIndex < addNodes.length &&
							addNode.nodeType == Node.TEXT_NODE ) {
							nextAddPosition = addPositionInOldWikiText +
								addNode.data.length;
						}
						else {
							nextAddPosition = addPositionInOldWikiText;
						}
 
						if ( ( nextDeletePosition <= nextAddPosition
							|| addNodeIndex == addNodes.length ) &&
							deleteNodeIndex < deleteNodes.length ) {
							if ( deleteNode.nodeType != Node.TEXT_NODE ) {
								// now we have a deletion
								mergedLine += deletedKeyword + deleteNode.innerHTML +
									endDeletedKeyword;
							} else {
								// now we have text from the old wikitext,
								// make sure you havent added it already...
								charsToAdd = nextDeletePosition - 
									mergedPositionInOldWikiText;
								mergedLine += deleteNode.data.substr( deleteNode.data.length -
									charsToAdd );
								deletePositionInOldWikiText = nextDeletePosition;
								mergedPositionInOldWikiText = deletePositionInOldWikiText;
							}
							deleteNodeIndex++;
						} else if ( addNodeIndex < addNodes.length ) {  // TODO: check necessary?
							 if ( addNode.nodeType != Node.TEXT_NODE ) {
								// now we have an addition
								mergedLine += addedKeyword + addNode.innerHTML +
									endAddedKeyword;
							} else {
								// now we have text from the new wikitext,
								// make sure you havent added it already...
								charsToAdd = nextAddPosition - 
									mergedPositionInOldWikiText;
								mergedLine += addNode.data.substr( addNode.data.length -
									charsToAdd );
								addPositionInOldWikiText = nextAddPosition;
								mergedPositionInOldWikiText = addPositionInOldWikiText;
							}
							addNodeIndex++;
						}
						if ( addNodeIndex == addNodes.length &&
								deleteNodeIndex == deleteNodes.length )
								parsedLine = true;
					}
					return mergedLine;
				},
				/**
				 * This function cleans the merged text, moving 
				 * markers for deletion and addition outside of wiki markups etc.
				 * 
				 * @param mergedText - the merged wikitexts
				 */
				cleanMergedText: function(mergedText) {
					mergedText = this.cleanBreakableMarkups(mergedText);
					// now restore sections
					var brokenSectionStart = deletedKeyword + "==";
					var brokenSectionEnd = "==" + endDeletedKeyword;
					var brokenSectionStartRegExp = new RegExp(brokenSectionStart, 'g');
					var brokenSectionEndRegExp = new RegExp(brokenSectionEnd, 'g');
					mergedText = mergedText.replace(brokenSectionStartRegExp,
						deletedKeyword + '\n==');
					mergedText = mergedText.replace(brokenSectionEndRegExp,
						'==\n' + endDeletedKeyword);
					brokenSectionStart = addedKeyword + "==";
					brokenSectionEnd = "==" + endAddedKeyword;
					brokenSectionStartRegExp = new RegExp( brokenSectionStart, 'g' );
					brokenSectionEndRegExp = new RegExp(brokenSectionEnd, 'g');
					mergedText = mergedText.replace(brokenSectionStartRegExp,
						addedKeyword + '\n==');
					mergedText = mergedText.replace(brokenSectionEndRegExp,
						'==\n' + endAddedKeyword);
					return mergedText;
				},
				/**
				 * This function checks whether '' for italic, ''' for bold
				 * or ''''' for italic and bold is enclosed in a
				 * deletion or addition tag and if so then tries to
				 * replicate the appropriate tag to restore a wikitext
				 * whose parse result matches the original (bolded what was bolded
				 * etc.)
				 * @param mergedText - the merged wikitexts
				 */
				cleanSymmetricalMarkups: function( mergedText ) {
					var markups = {
						italicAndBold: "'''''",
						bold: "'''",
						italic: "''"
					}
					// go through all markups, look if they have a keyword included
					for (var markupKey in markups) {
						var markup = markups[markupKey];
						var indexOfStartMarkup = mergedText.indexOf(markup, 
							0);
						var indexOfEndMarkup = mergedText.indexOf(markup, 
								indexOfStartMarkup + markup.length);
						var markupSubString = '';
						while (indexOfStartMarkup !== -1) {
							markupSubString = mergedText.substring(indexOfStartMarkup + 
								startMarkup.length, indexOfEndMarkup);
							// check substring for markups
							var cleanMarkup = this.cleanMarkupString( markupSubString,
								startMarkup, endMarkup );
							if (cleanMarkup !== null) {
								mergedText = mergedText.substring( 0, indexOfStartMarkup ) +
									cleanMarkup + 
									mergedText.substring( indexOfEndMarkup + endMarkup.length );
								// start looking for start markup after end markup
								// in transformed string...
								indexOfStartMarkup = mergedText.indexOf(startMarkup,
									indexOfStartMarkup + cleanMarkup.length);
							}
							else {
							indexOfStartMarkup = mergedText.indexOf(startMarkup,
								indexOfEndMarkup + endMarkup.length);
							}
							indexOfEndMarkup = mergedText.indexOf(endMarkup, 
								indexOfStartMarkup + startMarkup.length);
								
						}
					}
					return mergedText;
				},
				cleanSymmetricalMarkupString: function( markupString, markup ) {
					// find out if one of they end keywords is inside first,
					// if yes replicate keyword around markup
					// then look at end, find out if there is an unmatched
					// start keyword... again replicate if necessary
					// possibly remove markup(check when you have to do this)...
					var deleteStartIndex = markupString.indexOf(deletedKeyword);
					var deleteEndIndex = markupString.indexOf(endDeletedKeyword);
					var addStartIndex = markupString.indexOf(addedKeyword);
					var addEndIndex = markupString.indexOf(endAddedKeyword);
					var cleanMarkupStartString = markup;
					// check if any keyword is present
					if ( deleteStartIndex === -1 && deleteEndIndex === -1 && 
						addStartIndex === -1 && addEndIndex === -1 )
						return null;
					if ( deleteEndIndex !== -1 && deleteEndIndex < deleteStartIndex ) {
						// we have a end delete first, replicate delete tag around 
						// markup
						cleanMarkupStartString += endDeletedKeyword +
							cleanMarkupStartString + deletedKeyword;
					}
					else if ( addStartIndex !== -1 && addEndIndex < addStartIndex) {
						// we have a end add first, replicate add tag around 
						// markup
						cleanMarkupStartString += endAddedKeyword + 
							cleanMarkupStartString + addedKeyword;
					}
					// checked start of markupstring, now check the same for the end
					// of the markupstring (if there is an unclosed addition
					// or deletion tag);
					var cleanMarkupEndString = markup;
					deleteStartIndex = markupString.lastIndexOf( deletedKeyword );
					deleteEndIndex = markupString.lastIndexOf( endDeletedKeyword) ;
					addStartIndex = markupString.lastIndexOf( addedKeyword );
					addEndIndex = markupString.lastIndexOf( endAddedKeyword );
					// TODO(Robin): first check unnecessary (?)
					if ( deleteStartIndex !== -1 &&
					    deleteStartIndex > deleteEndIndex) {
						cleanMarkupEndString = endDeletedKeyword + 
							cleanMarkupEndString + deletedKeyword;
					}
					else if (addStartIndex !== -1 && addStartIndex > addEndIndex) {
						cleanMarkupEndString = endAddedKeyword +
							cleanMarkupEndString + addedKeyword;
					}
					var cleanMarkupString = cleanMarkupStartString +
						markupString + cleanMarkupEndString;
					return cleanMarkupString;
				},
				/**
				 * This function moves markers for deletion and addition
				 * outside of {{ }} or [[ ]], in order not to break
				 * the parsing
				 * 
				 * @param mergedText - the merged wikitexts
				 */
				cleanBreakableMarkups: function( mergedText ) {
					
					var markups = {
						templates: {
							start: '{{',
							end: '}}'
						},
						links: {
							start: '[[',
							end: ']]'
							}
					}
					// go through all markups, look if they have a keyword included
					for (var markup in markups) {
						var startMarkup = markups[markup].start;
						var endMarkup = markups[markup].end;
						var indexOfStartMarkup = mergedText.indexOf(startMarkup, 
							0);
						var indexOfEndMarkup = mergedText.indexOf(endMarkup, 
								indexOfStartMarkup + startMarkup.length);
						var markupSubString = '';
						while (indexOfStartMarkup !== -1) {
							markupSubString = mergedText.substring(indexOfStartMarkup + 
								startMarkup.length, indexOfEndMarkup);
							// check substring for markups
							var cleanMarkup = this.cleanMarkupString( markupSubString,
								startMarkup, endMarkup );
							if (cleanMarkup !== null) {
								mergedText = mergedText.substring( 0, indexOfStartMarkup ) +
									cleanMarkup + 
									mergedText.substring( indexOfEndMarkup + endMarkup.length );
								// start looking for start markup after end markup
								// in transformed string...
								indexOfStartMarkup = mergedText.indexOf(startMarkup,
									indexOfStartMarkup + cleanMarkup.length);
							}
							else {
							indexOfStartMarkup = mergedText.indexOf(startMarkup,
								indexOfEndMarkup + endMarkup.length);
							}
							indexOfEndMarkup = mergedText.indexOf(endMarkup, 
								indexOfStartMarkup + startMarkup.length);
								
						}
					}
					return mergedText;
				},
				/**
				 * Clean the markup string, that means reorder enclosed
				 * delete and addition tags in away that the markup can be parsed
				 * (move them outside the markup and if necessary duplicate 
				 *  parts of the markup!)
				 * @return clean markup string if there were enclosed keywords or 
				 * null otherwise
				 */
				cleanMarkupString: function( markupString, startMarkup, endMarkup ){
					var deleteStartIndex = markupString.indexOf(deletedKeyword);
					var deleteEndIndex = markupString.indexOf(endDeletedKeyword);
					var addStartIndex = markupString.indexOf(addedKeyword);
					var addEndIndex = markupString.indexOf(endAddedKeyword);
					// check if any keyword is present
					if ( deleteStartIndex === -1 && deleteEndIndex === -1 && 
						addStartIndex === -1 && addEndIndex === -1)
						return null;
					// now go through the markup string, always find first keyword
					var cleanMarkupStart = "";
					var cleanMarkupEnd = "";
					var markupIndex = 0;
					// deleted and added parts represent those parts that will
					// be enclosed in deleted and added keywords,
					// not those parts that were really deleted or added :)
					var markupDeletedParts = [];
					var markupAddedParts = [];
					// First case: First keyword is a delete end keyword
					if (deleteEndIndex !== -1  
						&&	(addEndIndex === -1 || deleteEndIndex < addEndIndex)
						&& (deleteStartIndex === -1 ||  deleteEndIndex < deleteStartIndex ) ) {
							cleanMarkupStart += endDeletedKeyword;
							markupDeletedParts.push( markupString.substring( 0, 
								deleteEndIndex) );
							markupIndex = deleteEndIndex + endDeletedKeyword.length;
						} else if ( addEndIndex !== -1
							&& ( deleteEndIndex === -1 || addEndIndex < deleteEndIndex ) // TODO(Robin): this line unnecessary...
							&& ( addStartIndex === -1 || addEndIndex < addStartIndex ) ) {
							// Second case: First keyword is an add end keyword
							cleanMarkupStart += endAddedKeyword;
							markupAddedParts.push( markupString.substring( 0, 
								addEndIndex) );
							markupIndex = addEndIndex + endAddedKeyword.length;
					}
					else {
					// Third case: First keyword is a start keyword
						if ( deleteStartIndex !== -1 && 
							( deleteStartIndex < addStartIndex || addStartIndex === -1 ) ) {
							markupAddedParts.push( markupString.substring( 0, deleteStartIndex ) );
							if ( deleteEndIndex === - 1) {
								// whole string is part of deleted revision...
								markupDeletedParts.push( markupString.
									replace( deletedKeyword, "" ) );
								markupIndex = markupString.length;
							} else {
								markupDeletedParts.push( markupString.substring( 0, deleteStartIndex ) +
													 markupString.substring( deleteStartIndex +
												 deletedKeyword.length, deleteEndIndex) );
								markupIndex = deleteEndIndex + endDeletedKeyword.length;
							}
						} else {
							markupDeletedParts.push( markupString.substring( 0, addStartIndex ) );
							if ( addEndIndex === - 1) {
								// whole string is part of added revision...
								markupAddedParts.push( markupString.replace(addedKeyword, "") );
								markupIndex = markupString.length;
							} else {
								markupAddedParts.push( markupString.substring( 0, addStartIndex ) +
														 markupString.substring( addStartIndex +
													 addedKeyword.length, addEndIndex) );
								markupIndex = addEndIndex + endAddedKeyword.length;
							}
						}
 
					}
					// now run through the rest of the markupstring...
					// we can always expect start tags to come first now
					deleteStartIndex = markupString.indexOf( deletedKeyword, markupIndex );
					addStartIndex = markupString.indexOf( addedKeyword, markupIndex );
					while( !( deleteStartIndex === -1 && addStartIndex === -1 ) ) {
						if ( deleteStartIndex !== -1 && 
							( deleteStartIndex < addStartIndex || addStartIndex === -1 ) ) {
							deleteEndIndex = markupString.indexOf( endDeletedKeyword,
								deleteStartIndex);
								markupAddedParts.push( markupString.substring( markupIndex,
									deleteStartIndex) );
							if ( deleteEndIndex === -1 ){
								cleanMarkupEnd += deletedKeyword;
								markupDeletedParts.push( markupString.substring( markupIndex ) );
								markupIndex = markupString.length;
							} else {
								markupDeletedParts.push( 
									markupString.substring( 
										markupIndex, deleteStartIndex ) + 
									markupString.substring( 
										deleteStartIndex + deletedKeyword.length, 
										deleteEndIndex) );
								markupIndex = deleteEndIndex + endDeletedKeyword.length;
							}
						} else {
							// add start keyword is next keyword...
							markupDeletedParts.push( markupString.substring( markupIndex,
								addStartIndex) );
							if ( addEndIndex === -1 ){
								cleanMarkupEnd += addedKeyword;
								markupAddedParts.push( markupString.substring( markupIndex ) );
								markupIndex = markupString.length;
							} else {
								markupAddedParts.push( 
									markupString.substring( 
										markupIndex, addStartIndex ) + 
									markupString.substring( 
										addStartIndex + addedKeyword.length, 
										addEndIndex) );
								markupIndex = addEndIndex + endAddedKeyword.length;
							}
						}
						deleteStartIndex = markupString.indexOf( deletedKeyword, markupIndex );
						addStartIndex = markupString.indexOf( addedKeyword, markupIndex );
					}
					// remainder of markup is in both revisions
					markupDeletedParts.push( markupString.substring(markupIndex) );
					markupAddedParts.push( markupString.substring(markupIndex) );
					var cleanMarkupString = cleanMarkupStart;
					var deletedString = markupDeletedParts.join('');
					if (deletedString != '') {
						cleanMarkupString += deletedKeyword + startMarkup +
							deletedString + endMarkup + endDeletedKeyword;
					}
					var addedString = markupAddedParts.join('');
					if ( addedString != '' ) {
						cleanMarkupString += addedKeyword + startMarkup +
							addedString + endMarkup + endAddedKeyword;
					}
					cleanMarkupString += cleanMarkupEnd;
					return cleanMarkupString;
				}
			},
			// ids referring to revisions in the revisionList!
			currentRevision: 0,
			revisionToDiffTo: 0,
			getRevisionStartId: function() {
				var oldIdIndex = document.URL.indexOf('&oldid=');
				if (oldIdIndex != -1)
					return parseInt(document.URL.substr(oldIdIndex + 7));
				else
					return mw.config.get('wgCurRevisionId');
				},
            mergeDiffsAndApplyThem: function( fromWikiText, toWikiText, 
				diffWikiText ) {
				var mergedDiffs = this.parseHelper.mergeDiff( fromWikiText, toWikiText,
					diffWikiText );
                $.ajax({
                            type: 'POST',
                            url: mw.util.wikiScript( 'api' ),
                            success: function(data) {
                                var parsedText = data.parse.text[ '*' ];
								// remove the newline text nodes and replace \" by " 
                                var cleanedText = parsedText.replace( /\\n/g, '' );
								cleanedText = cleanedText.replace( /\\"/g, '' );
								// now replace keywords for additions and deletions
								// first check for replaced keywords enclosed in <p>-tags

								$('#queryanswer').html(mw.html.escape(cleanedText));
								var regexpDeleteStartEnclosed = new RegExp(
									'<p>' + deletedKeyword + '</p>', 'g' );
								var regexpDeleteEndEnclosed = new RegExp (
									'<p>' + endDeletedKeyword + '</p>', 'g' );
								var regexpAddStartEnclosed = new RegExp(
									'<p>' + addedKeyword + '</p>', 'g' );
								var regexpAddEndEnclosed = new RegExp(
									'<p>' + endAddedKeyword + '</p>', 'g' );
								var regExpDeleteEndAndAddStartEnclosed = new RegExp(
									'<p>' + endDeletedKeyword + addedKeyword + '</p>', 'g' );
								cleanedText = cleanedText.replace( regexpDeleteStartEnclosed, '<del>' );
								cleanedText = cleanedText.replace( regexpDeleteEndEnclosed, '</del>' );
								cleanedText = cleanedText.replace( regexpAddStartEnclosed, '<ins>' );
								cleanedText = cleanedText.replace( regexpAddEndEnclosed, '</ins>' );
								cleanedText = cleanedText.replace(
									regExpDeleteEndAndAddStartEnclosed, '</del><ins>' );
	
								var regexpDeleteStart = new RegExp( deletedKeyword, 'g' );
								var regexpDeleteEnd = new RegExp ( endDeletedKeyword, 'g' );
								var regexpAddStart = new RegExp( addedKeyword, 'g' ) ;
								var regexpAddEnd = new RegExp( endAddedKeyword, 'g' ) ;
								cleanedText = cleanedText.replace( regexpDeleteStart, '<del>' );
								cleanedText = cleanedText.replace( regexpDeleteEnd, '</del>' );
								cleanedText = cleanedText.replace( regexpAddStart, '<ins>' );
								cleanedText = cleanedText.replace( regexpAddEnd, '</ins>' );
 
								$('#queryanswer').append("<br /><br /><br />-------------<br />" + 
									mw.html.escape(cleanedText));
                                mw.util.$content.html( cleanedText );
								$( '#visual-changes-backward-button' ).show();
								$( '#visual-changes-forward-button' ).show();
                            },
                            dataType: 'json',
                            async: true,
                            data: {
                                    action: 'parse',
                                    text: mergedDiffs,
                                    format: 'json'
                            }
                });
                return mergedDiffs;
 
            },
            reallySetCurRevision : function ( toRevNr ) {	
				var fromRevId = this.article.revisionInfos[ this.currentRevision ].revid;
				var toRevId =  this.article.revisionInfos[ toRevNr ].revid;
                var fromWikiText = this.article.revisionTexts[ fromRevId ][ '*' ];
                var toWikiText = this.article.revisionTexts[ toRevId ][ '*' ];
                $('#wikitext').html( 'Wikitext ' + toRevId + ':<br />' +
                                     toWikiText.replace( /\r?\n/g, '<br />' ) );
                $('#oldwikitext').html( 'Old Wikitext ' + fromRevId + ':<br />' +
                                     fromWikiText.replace( /\r?\n/g, '<br />' ) );
               $.ajax({
                            type: 'POST',
                            url: mw.util.wikiScript( 'api' ),
                            success: function(data) {
                                //TODO: remove stringify method!
                                $('#diff').html( JSON.stringify(data) );
                                var mergedDiff = visualChanges.mergeDiffsAndApplyThem( 
									fromWikiText, toWikiText, data.compare[ '*' ] );
                                $('#mergeddiff').html( 'MergedDiffs: <br>' + mergedDiff );
                                visualChanges.currentRevision = toRevNr;
                            },
                            dataType: 'json',
                            async: true,
                            data: {
                                    action: 'compare',
                                    fromrev: fromRevId,
                                    torev: toRevId,
                                    format: 'json'
                            }
                });
            },
			getRevisionTextsAndShowDiff: function ( fromRevId, toRevId, toRevNr )
			{
				// check for availability of these revisions
				var revisionsToGet = "";
				if ( !this.article.revisionTexts.hasOwnProperty(fromRevId) ) {
					revisionsToGet += fromRevId
				}
				if ( !this.article.revisionTexts.hasOwnProperty(toRevId) ) {
					if ( revisionsToGet != "")
						revisionsToGet += "|"
					revisionsToGet += toRevId
				}
				if ( revisionsToGet == "" )
					this.reallySetCurRevision( toRevNr );
				else {
					$.ajax( {
					type: 'POST',
					url: mw.util.wikiScript( 'api' ),
					success: function( data ) {
										//TODO: remove stringify method!
										$('#queryanswer').html( JSON.stringify( data ) );
										// add the revisions to the text
										var page = data.query.pages[visualChanges.article.articleId];
										var revisions = page.revisions;
										var revision;
										for ( var i = 0; i < revisions.length; i++ ) {
											revision = revisions[i];
											visualChanges.article.revisionTexts[revision.revid] = revision;
										}
										// check that revision is now there
										if (visualChanges.article.revisionTexts.hasOwnProperty(fromRevId)
											&& visualChanges.article.revisionTexts.hasOwnProperty(toRevId))
											visualChanges.reallySetCurRevision(toRevNr);
										else
											alert('revision not downloaded, shouldnt happen..');
									},
					dataType: 'json',
					async: true,
					data: {
						action: 'query',
						revids: revisionsToGet,
						prop: 'revisions',
						rvprop: 'ids|timestamp|parsedcomment|content',
						format: 'json'
						}
					});
				}
			},
			getRevisionInfosAndTextAndShowDiff: function( revisionNr, extraRevisionsToGet ) {
				// start id for next revision should be the last revision
				// id for which there are infos or the revision being looked
				// at right now
				var revisionStartId;
				if ( this.article.revisionInfos.length >  0)
					revisionStartId = this.article.revisionInfos
						[this.article.revisionInfos.length -1].revid - 1;
				else
					revisionStartId = this.getRevisionStartId();
				var revisionsToGet = revisionNr - this.article.revisionInfos.length
										+ extraRevisionsToGet;
				$.ajax({
                            type: 'POST',
                            url: mw.util.wikiScript( 'api' ),
                            success: function(data) {
								// add the new revision infos
								var revisionInfos = data.query.pages[
									visualChanges.article.articleId ].revisions;
								visualChanges.article.revisionInfos = 
									visualChanges.article.revisionInfos.concat(revisionInfos);
								if (visualChanges.article.revisionInfos.length > revisionNr) {
									var fromRevId = visualChanges.article.revisionInfos
										[ visualChanges.currentRevision ].revid;
									var toRevId = visualChanges.article.revisionInfos
										[ revisionNr ].revid;
									// now get the texts of the needed revisions and apply them
									visualChanges.getRevisionTextsAndShowDiff(
									fromRevId, toRevId, revisionNr);
									} else {  // try again!
										visualChanges.getRevisionInfosAndTextAndShowDiff(
											extraRevisionsToGet, revisionNr );
									};
 
 
                            },
                            dataType: 'json',
                            async: true,
							data: {
							action: 'query',
							prop: 'revisions',
							rvprop: 'ids|timestamp',
							pageids: mw.config.get('wgArticleId'),
							rvlimit: revisionsToGet,
							rvstartid: revisionStartId,
							format: 'json'
							}
				});
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
        $( '#content' ).before(mw.html.element('div', 
                        {id: 'visual-changes-menu',
                        'class': 'visual-changes-menu-relative'},
                        new mw.html.Raw(
                        mw.html.element( 'a',
                                    {id: 'visual-changes-backward-button',
                                      href: '#visualchanges'}, 'B' ) +
                          mw.html.element( 'a',
                                {id: 'visual-changes-forward-button',
                                  href: '#visualchanges'}, 'F' ) ) ) );
                              // TODO: remove logtable!
            $( '#bodyContent' ).after( '<table id="logtable"><tr> <td colspan = "2" id="queryanswer"></td>' + 
                                    '<tr><td id="wikitext">Wikitext:</td><td id="oldwikitext">old Wikitext</td></tr>' +
                                 '<tr><td colspan = "2" id="diff">diff</td></tr>' +
                                 '<tr><td colspan = "2" id="mergeddiff">mergeddiff</td></tr></table>' );
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