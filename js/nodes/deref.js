define(function(require) {

	var Node = require('node');

	class Deref extends Node {

		constructor() {
			super(null, "d", "mediumpurple1"); 
		}

		transition(token, link) {
			if (link.to == this.key) 
				return this.findLinksOutOf(null)[0]; 
			else if (link.from == this.key) 
				return this.findLinksInto(null)[0]; 				
		}

		copy() {
			return new Deref();
		}

	}
	return Deref;
});