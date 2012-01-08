
( function( $ ) {
	function pad(number, length)
	{
		var str = '' + number;
		while (str.length < length) {
			str = '0' + str;
		}
		return str;
	}
	// functions for the buttons...
	visualChangesUI = {
		clickBackwardButton : function(){
			//$( '#visual-changes-forward-button' ).hide();
			//$( '#visual-changes-backward-button' ).hide();
			visualChangesController.goToPreviousRevision();
		},
		clickForwardButton: function() {
			//$( '#visual-changes-forward-button' ).hide();
			//$( '#visual-changes-backward-button' ).hide();				
			visualChangesController.goToNextRevision();
		},
		// just check if its a correct date
		dateFieldChanged: function() {
			var mediaWikiDate = visualChangesUI.fieldToMediaWikiDate($(this));
			if (mediaWikiDate === false){
				$(this).css('color', 'red');				
			} else {
				$(this).css('color', 'black');
			}
		},
		timeFieldChanged: function() {
			var timeString = visualChangesUI.stringToTime($(this).val());
			if (timeString === false)
				$(this).css('color', 'red');				
			else 
				$(this).css('color', 'black');
		},
		clickViewHistoryButton: function()
		{
			$(this).hide();
			var animationTime = 500;
			$( '#visual-changes-menu' ).show(animationTime);
		},
		clickSubmitTimesButton: function() {
			// get days and times from and to fields
			// send them to server
			// simply use the text in the date field and parse it to a mediawiki time
			// with jquery.ui.datepicker'#vc-from-date-entry'

			var fromDateString = $( '#vc-from-date-entry' ).val();
			var allowedFromFormats = visualChangesUI.getAllowedDateFormats();
			allowedFromFormats.push($('#vc-from-date-entry').datepicker( 'option', 'dateFormat' ));
			var fromTimeString = $( '#vc-from-time-entry' ).val();
			var toDateString = $( '#vc-to-date-entry' ).val();
			var allowedToFormats = visualChangesUI.getAllowedDateFormats();
			allowedToFormats.push($('#vc-to-date-entry').datepicker( 'option', 'dateFormat' ));
			var toTimeString = $( '#vc-to-time-entry' ).val();
			var inputs = visualChangesUI.parseInputs( fromDateString, 
										allowedFromFormats, 
										fromTimeString,
										toDateString,
										allowedToFormats,
										toTimeString );
			if (inputs.fromDay !== false && inputs.fromTime !== false &&
				inputs.toDay !== false && inputs.toTime !== false) {
				var fromTimeStamp = visualChangesUI.createMediaWikiTimeStamp(inputs.fromDay, 
					inputs.fromTime.hour, inputs.fromTime.minute, inputs.fromTime. second);
				var toTimeStamp = visualChangesUI.createMediaWikiTimeStamp(inputs.toDay,
					inputs.toTime.hour, inputs.toTime.minute, inputs.toTime.second);
				if (fromTimeStamp > toTimeStamp) {
					alert('Time to compare from must be before time to compare to.');
				} else {						
					visualChangesController.diffTimes(fromTimeStamp, toTimeStamp);
				}
			} else { // something went wrong :)
				// mark wrong entries with red text...
				if (inputs.fromDay === false)
					$('#vc-from-date-entry').css('color', 'red');
				if (inputs.fromTime === false)				
					$('#vc-from-time-entry').css('color', 'red');
				if (inputs.toDay === false)
					$('#vc-to-date-entry').css('color', 'red');
				if (inputs.toTime === false)			
					$('#vc-to-time-entry').css('color', 'red');
			}
			return;
			
		},
		parseInputs: function( fromDateString, allowedFromDateFormats, fromTimeString,
						      toDateString, allowedToDateFormats, toTimeString ) {
			var fromDay = visualChangesUI.stringToDate( allowedFromDateFormats,
															fromDateString);
			var fromTime = this.stringToTime(fromTimeString);
			var toDay = visualChangesUI.stringToDate( allowedToDateFormats,
															toDateString);
			var toTime = this.stringToTime(toTimeString);
			return {fromDay : fromDay, fromTime : fromTime, toDay: toDay, toTime: toTime};			
		},
		fieldToMediaWikiDate: function( htmlTextField ) {
			var allowedFormats = visualChangesUI.getAllowedDateFormats();
			allowedFormats.push( $(htmlTextField).datepicker( 'option', 'dateFormat' ) );
			var enteredDateString = $(htmlTextField).val();
			var mwDateString = visualChangesUI.stringToMediaWikiDate( allowedFormats,
															enteredDateString);
			return mwDateString;
				
		},
		stringToMediaWikiDate: function( /* string array */ validFormats, dateString ) {
			var mediaWikiDateFormat = 'yymmdd';
			var enteredDate = this.stringToDate(validFormats, dateString);
			if (enteredDate !== false) {
				var mediaWikiDateString = $.datepicker.formatDate( mediaWikiDateFormat, 
																	enteredDate );
				return mediaWikiDateString;
			} else {
				return false;
			}
		},
		
		stringToDate: function (/* string array */ validFormats, dateString) {
			for (var i in validFormats) {
				var format = validFormats[i];
				try
				{
					var date = $.datepicker.parseDate(format, dateString);
					// should have valid date now...
					return date;
				} catch(e) {
					// do nothing, try next possible format
					//TODO(Robin): alert user if something specific missing, like year?
				}
			}
			return false;
		},
		createMediaWikiTimeStamp: function(date, hour, minute, second) {
			if (hour >= 0 && hour < 24
				&& minute >= 0 && minute < 60 && second >= 0 && second < 60) {
				return pad(date.getFullYear(), 4) + pad(date.getMonth() + 1, 2) +
					pad(date.getDate(), 2) + pad(hour, 2) + pad (minute, 2) + pad (second, 2);
			} else {  // something went wrong
				return false;
			}
		},
		setBodyContent: function( newBodyContent )
		{
			mw.util.$content.html( newBodyContent );
		},
		setLogDivContent: function(newLogDivContent)
		{
			$("#logdiv").html(newLogDivContent);
		},
		getAllowedDateFormats: function() {			
			return [ 'd.m.yy', 'd.mm.yy', 'dd.m.yy', 'dd.mm.yy',
					 'm/d/yy', 'mm/d/yy','m/dd/yy',  'mm/dd/yy' ];
		},
		/* Convert timestring to time object:
		 * timeString should have format hh:mm:ss
		 * hh - hour with one or two digits
		 * mm - month with one or two digits
		 * ss - second with one or two digits
		 * returns object with properties "hour", "minute" and "second" if string was valid
		 * else returns false
		 */
		stringToTime: function(timeString) {
			// check if its in the correct time format :)
			var timeMatches = timeString.match(/[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}/g);
			if (timeMatches != null &&
				timeMatches.length == 1 &&
				timeMatches[0].length == timeString.length) {
				// extract hour, minute and second :)
				timeMatches = timeString.match(/[0-9]{1,2}/g);
				var hour = parseInt( timeMatches[ 0 ] );
				var minute = parseInt( timeMatches[ 1 ] );
				var second = parseInt( timeMatches[ 2 ] );
				// check if time is in range
				if (hour >= 0 && hour < 24 &&
					minute >= 0 && minute < 60 &&
					second >= 0 && second < 60)
					return {hour: hour, minute: minute, second: second};
				else
					return false;
			} else {
				return false;
			}
		},
		initializeMenu: function()
		{
			// TODO(Robin): find better way/point/position to initialize the menu?
			var htmlMenu = '<input type="button" id="visual-changes-viewhistory-button" value="View History"></input> \n\
							<div id="visual-changes-menu">\n\
								<div id = "visual-changes-datepickers"> \n\
									<div id = "visual-changes-fromdates" class="visual-changes-upper-menu-entry">\n\
										<input type="text" id="vc-from-date-entry"  class="visual-changes-date-entry"/>\n\
										<input type="text" id="vc-from-time-entry" class = "visual-changes-time-entry"/>\n\
									</div>\n\
									<span id="rightarrow" class="visual-changes-upper-menu-entry">&rarr;</span>\n\
									<div id = "visual-changes-todates" class="visual-changes-upper-menu-entry">\n\
										<input type="text"id="vc-to-date-entry"  class = "visual-changes-date-entry"/>\n\
										<input type="text" id="vc-to-time-entry" class = "visual-changes-time-entry"/>\n\
									</div>\n\
								</div>\n\
								<a id="visual-changes-backward-button" href="#visualchanges">B</a>\n\
								<a id="visual-changes-forward-button" href="#visualchanges">F</a>\n\
								<input type="button" id="visual-changes-submittimes-button" class="visual-changes-upper-menu-entry" value="Show Changes" /> \n\
							</div>'
			$( '#content' ).prepend(htmlMenu);
			// TODO(Robin): amke these into range datepickers see http://jqueryui.com/demos/datepicker/#date-range
			$( '#vc-from-date-entry' ).datepicker( {dateFormat: 'mm/dd/yy'} );
			$( '#vc-to-date-entry' ).datepicker( {dateFormat: 'mm/dd/yy'} );
			$( '#visual-changes-viewhistory-button' ).click(visualChangesUI.clickViewHistoryButton);
			var currentDate = new Date();
			$( '#vc-from-date-entry' ).datepicker( 'setDate', currentDate );
			$( '#vc-to-date-entry' ).datepicker( 'setDate', currentDate );
			var currentTimeString = pad(currentDate.getHours(), 2) + ':' +
									pad(currentDate.getMinutes(), 2) + ':' +
									pad(currentDate.getSeconds(), 2);
			$( '#vc-from-time-entry' ).val( currentTimeString );
			$( '#vc-to-time-entry' ).val( currentTimeString );
			// If user scrolls below the position of
			// the visual-changes-menu, make the menu move to a fixed position on
			// the screen by changing the class (see ext.visualChanges.css
			// for styling)
			var visualChangesMenu = $( '#visual-changes-menu' );
			var offset = visualChangesMenu.offset();
			var topOffset = offset.top;
			$( '#vc-from-date-entry' ).change( visualChangesUI.dateFieldChanged );
			$( '#vc-from-date-entry' ).keyup( visualChangesUI.dateFieldChanged );
			$( '#vc-to-date-entry' ).change( visualChangesUI.dateFieldChanged );
			$( '#vc-to-date-entry' ).keyup( visualChangesUI.dateFieldChanged );
			$( '#vc-from-time-entry' ).change( visualChangesUI.timeFieldChanged );
			$( '#vc-from-time-entry' ).keyup( visualChangesUI.timeFieldChanged );
			$( '#vc-to-time-entry' ).change( visualChangesUI.timeFieldChanged );
			$( '#vc-to-time-entry' ).keyup( visualChangesUI.timeFieldChanged );
		}
	}
} )( jQuery );
