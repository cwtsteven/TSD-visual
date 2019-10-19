define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();

	class PatTuple extends Node {

		constructor() {
			super(null, "'","mediumpurple1");
		}
		
		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("n")[0];
				if (link.toPort == "e")
					token.dataStack.push(CompData.PR);
				else if (link.toPort == "w")
					token.dataStack.push(CompData.PL);
				return nextLink;
			}
			else if (link.from == this.key) {
				var nextLink;
				var direction = token.dataStack.pop();
				if (direction == CompData.PR)
					nextLink = this.findLinksInto("e")[0];
				else if (direction == CompData.PL)
					nextLink = this.findLinksInto("w")[0];
				return nextLink; 
			}
		}

		copy() {
			return new PatTuple();
		}
	}

	return PatTuple;
});