define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var Pair = require('token').Pair();	

	class Deref extends Node {

		constructor(hasPname, pname) {
			super(null, "d", "mediumpurple1"); 
			this.hasPname = hasPname;
			this.updatePName(pname);
		}

		transition(token, link) {
			if (link.to == this.key) 
				return this.findLinksOutOf(null)[0]; 
			else if (link.from == this.key) 
				var data = token.dataStack.pop();
				token.dataStack.push(new Pair(data.a, CompData.DEP))
				return this.findLinksInto(null)[0]; 				
		}

		copy() {
			return new Deref(this.hasPname, this.pname);
		}

		updatePName(pname) {
			if (this.hasPname) {
				this.pname = pname;
				this.text = "d("+pname+")";
			}
		}

	}
	return Deref;
});