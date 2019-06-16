define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Contract = require('nodes/contract');

	class Dependency extends Node {
		
		constructor(alpha) {
			super(null, "G\n(" + alpha + ")", "indianred1");
			this.alpha = alpha;
			this.width = "1";
			this.height = "1";
		}

		transition(token, link) {
			token.machine.newValues.set(this.alpha, token.dataStack.last()[0]);
			token.delete();
		}

		copy() {
			var dep = new Dependency();
			return dep;
		}
	}

	return Dependency;
});