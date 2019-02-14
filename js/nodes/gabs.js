define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();

	class GAbs extends Node {

		constructor() {
			super(null, "abs","indianred1");
		}
		
		transition(token, link) { 
			if (link.to == this.key && link.toPort == "s") {
				var nextLink = this.findLinksOutOf("n")[0];
				token.rewriteFlag = RewriteFlag.F_GABS;
				return nextLink; 
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_GABS && nextLink.from == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				// TODO
				
					
				token.rewrite = true;
				return nextLink;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		

		copy() {
			return new GAbs();
		}
	}

	return GAbs;
});