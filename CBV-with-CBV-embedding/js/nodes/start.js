define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var State = require('link').State();

	class Start extends Node {

		constructor() {
			super("point", "");
		}
		
		transition(token) {
			if (token.link == null && token.dataStack.last() == CompData.PROMPT) {
				var nextLink = this.findLinksOutOf(null)[0];
				token.forward = true;
				nextLink.state = State.B;
				return nextLink;
			}
			else 
				return null;
		}
		
		copy() {
			return new Start();
		}

		draw(level) {
			return level + this.key + '[shape=' + this.shape + '];'; 
		}

	}

	return Start;
});