define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Mod = require('nodes/mod');
	var Dependency = require('nodes/depend');
	var Const = require('nodes/const');
	var Link = require('link');
	var Pair = require('token').Pair();

	class ProvCon extends Node {
		
		constructor(n) {
			super(null, "Pc("+n+")", "indianred1");
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

		copy() {
			var pc = new ProvCon(this.n);
			return ProvCon;
		}
	}

	return ProvCon;
});