define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var State = require('link').State();

	class Const extends Node {

		constructor(name) {
			super(null, name, name);
		}
		
		transition(token, link) {
			if (token.dataStack.last() == CompData.PROMPT) {
				token.dataStack.pop();
				token.dataStack.push(this.name);
				token.forward = false;
				link.state = State.O;
				return link;
			}
		}

		copy() {
			return new Const(this.name);
		}
	}

	return Const;
});