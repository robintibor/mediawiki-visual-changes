/* Some misc JavaScript compatibility tests, just to make sure the environments we run in are consistent */

module( 'ext.visualChanges' );

test( 'toMediaWikiDate', function() {
	expect(8);
	// specify which formats are allowed
	// d is for days wihtout leading 0s dd for days with leading 0s
	// same for m and mm (for months)
	// yy means 4-digit years
	var allowedFormats = getAllowedDateFormats();
	// now i can make some tests
	equal( visualChangesUI.stringToMediaWikiDate( allowedFormats, 'blub' ),
		false, 'random words shouldn\'t be dates..' );
	equal( visualChangesUI.stringToMediaWikiDate( allowedFormats, '01/04/2012' ),
		 '20120104', 'american(?) format test' );
	equal( visualChangesUI.stringToMediaWikiDate( allowedFormats, '1/4/2012' ),
		  '20120104', 'american(?) format test without padding' );
	equal( visualChangesUI.stringToMediaWikiDate( allowedFormats, '04.01.2012' ),
		'20120104', 'european(?) format test' );
	equal( visualChangesUI.stringToMediaWikiDate( allowedFormats, '4.1.2012' ),
		'20120104', 'european(?) format test without padding' );
	equal( visualChangesUI.stringToMediaWikiDate( allowedFormats, '4.13.2012' ),
		false, 'no 13th month ...' );
	equal( visualChangesUI.stringToMediaWikiDate( allowedFormats, '-4.1.2012' ),
		false, 'no negative days ...' );
	equal( visualChangesUI.stringToMediaWikiDate( allowedFormats, '33.1.2012' ),
		false, 'no 33rd day...' );
});

test( 'stringToTime', function() {
	expect(5);
	// now i can make some tests
	equal( visualChangesUI.stringToTime( 'blub' ),
		false, 'random words shouldn\'t be times..' );
	deepEqual( visualChangesUI.stringToTime( '00:02:23' ),
			{hour : 0, minute : 2, second: 23}, 'normal time ' );
	deepEqual( visualChangesUI.stringToTime( '9:4:55' ),
			{hour : 9, minute : 4, second: 55}, 'time without 0s ' );
	equal( visualChangesUI.stringToTime( '25:2:55' ), false, 'hour too big' );
	equal( visualChangesUI.stringToTime( '-1:2:55' ), false, 'hour negative' );
});

test( 'parseInputs', function() {
	expect(2);
	var allowedFormats = getAllowedDateFormats();
	// now i can make some tests
	deepEqual( visualChangesUI.parseInputs( 'bla' , allowedFormats, 'blub',
										'bla' , allowedFormats, 'blub'),
		{fromDay : false, fromTime : false, toDay: false, toTime: false},
		'random words shouldn\'t be times or dates..' );
		// date moths go form 0 to 11 
	deepEqual( visualChangesUI.parseInputs( '01/04/2012' , allowedFormats, '00:02:23' ,
										'02/12/2012' , allowedFormats, '23:4:59' ),
		{fromDay : new Date(2012, 0, 4), fromTime : {hour : 0, minute : 2, second: 23},
			toDay: new Date(2012, 1, 12), toTime: {hour : 23, minute : 4, second: 59}},
		'correct entry test' );
});

test( 'createMediaWikiTimeStamp', function() {
	expect(4);
	// now i can make some tests
	// warning: month in javascript date go from 0 to 11 !
	equal( visualChangesUI.createMediaWikiTimeStamp( new Date( 2012, 11, 13 ), 13, 22, 35 ),
		'20121213132235',
		'correct test no padding necessary..' );
	equal( visualChangesUI.createMediaWikiTimeStamp( new Date( 2012, 0, 4 ), 13, 22, 35 ),
		'20120104132235',
		'correct test with padding of day and month..' );
	equal( visualChangesUI.createMediaWikiTimeStamp( new Date( 2012, 0, 4 ), 1, 2, 4 ),
		'20120104010204',
		'correct test with padding of everything except year..' );
	equal( visualChangesUI.createMediaWikiTimeStamp( new Date( 112, 0, 4 ), 1, 2, 4 ),
		'01120104010204',
		'correct test with padding of everything..' );
});
function getAllowedDateFormats()
{
	return [ 'd.m.yy', 'd.mm.yy', 'dd.m.yy', 'dd.mm.yy',
			 'm/d/yy', 'mm/d/yy','m/dd/yy',  'mm/dd/yy' ];
}