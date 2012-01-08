<?php
class ApiVisualChangesDiffTest extends MediaWikiTestCase {


 protected function setUp() {
                parent::setUp();
 
        }
        protected function tearDown() {
                parent::tearDown();
        }
        public function testMergeWikiTexts() {
			$testTextFrom = "blabla\nblub\nblabla";
			$testTextTo = "blabla\nblabla";
			$mergedText = VisualChangesDiff::mergeWikiTexts($testTextFrom,
																$testTextTo);
            $this->assertEquals("blabla\n<span class=\"vc_deletion\">\nblub\n</span>\n" .
				                "blabla",
								$mergedText);
			
        }
}
?>
