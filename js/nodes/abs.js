define(function(require) {
	var Node = require('node');
	var CompData = require('token').CompData();
	var Pair = require('token').Pair();
	
	class Abs extends Node {

		constructor() {
			super(null, "λ", "yellow");
		}
		
		transition(token, link) {
			if (link.to == this.key && link.toPort == "s") {
				var prev = this.graph.findNodeByKey(this.findLinksInto("s")[0].from);
				var data = token.dataStack.last();
				token.dataStack.pop();
				token.dataStack.push(new Pair(CompData.LAMBDA,CompData.EMPTY));
				token.forward = false;
				return link;
			}
		}

		copy() {
			return new Abs();
		}
	}

	return Abs;
});