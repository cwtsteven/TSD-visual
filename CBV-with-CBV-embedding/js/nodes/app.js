define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();

	class App extends Node {

		constructor() {
			super(null, "@");
		}
		
		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("e")[0];
				return this.checkLinkState(nextLink, function() {
					token.dataStack.push(CompData.PROMPT);
					return nextLink;
				});
			}
			else if (link.from == this.key && link.fromPort == "e") {
				var nextLink = this.findLinksOutOf("w")[0];
				return this.checkLinkState(nextLink, function() {
					token.dataStack.pop();
					token.dataStack.push(CompData.R);
					token.forward = true;
					return nextLink;
				});
			}
		}

		copy() {
			return new App();
		}
	}

	return App;
});