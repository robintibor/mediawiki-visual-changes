<?php

class ApiVisualChangesDiff extends ApiQueryBase {


	public function __construct( $query, $moduleName ) {
		parent::__construct( $query, $moduleName);
	}

	/**
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
                // get the two revisions tests
                $revisionFrom = $this->getParameter('revfrom');
                $revisionTo = $this->getParameter('revto');
                // get Diff between two revisions in their wikitext
                // add special words to old wikitext
                // parse wikitext
                // replace special words by colors etc
                // return new html for page content mwcontentltr
				
				$this->getResult()->addValue( null, 'VisualDiff',
								array( 'test'=>'testAntwort'  . $revisionFrom . $revisionTo) );
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
