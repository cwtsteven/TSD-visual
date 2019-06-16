define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var Pair = require('token').Pair();

	class Const extends Node {

		constructor(name) {
			super(null, name, "mediumpurple1", name);
		}
		
		transition(token, link) {
			if (token.dataStack.last() == CompData.PROMPT) {
				token.dataStack.pop();
				token.dataStack.push(new Pair(this.name,CompData.EMPTY));
				token.forward = false;
				return link;
			}
		}

		copy() {
			return new Const(this.name);
		}
	}

	return Const;
});