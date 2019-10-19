define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var Pair = require('token').Pair();

	class ProvCon extends Node {
		
		constructor(n) {
			super(null, "⟨"+n+"⟩", "indianred1");
			this.data = n; 
			//this.width = "1";
			//this.height = "1";
		}

		transition(token, link) {
			if (link.to == this.key) {
				token.dataStack.pop();
				token.dataStack.push(new Pair(this.data,CompData.DEP));
				token.forward = false;
				return link;
			}
		}

		update(data) {
			this.data = data;
			this.text = "⟨"+data+"⟩";
		}

		copy() {
			var pc = new ProvCon(this.n);
			return ProvCon;
		}
	}

	return ProvCon;
});