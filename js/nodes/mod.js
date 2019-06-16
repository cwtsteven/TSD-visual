define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Contract = require('nodes/contract');
	var Pair = require('token').Pair();

	class Mod extends Node {
		
		constructor(n) {
			super(null, "", "indianred1");
			this.data = n;
			this.update(n);
			this.dep_key = null;
			this.graph.machine.cells.push(this.key);
			this.width = "1";
			this.height = "1";
		}

		transition(token, link) {
			if (link.to == this.key) {
				token.dataStack.pop();
				token.dataStack.push(new Pair(this.data,this.key));
				token.forward = false;
				return link;
			}
		}

		update(data) {
			if ((isNumber(data) || typeof(data) === "boolean")) {
				var oldData = this.data;
				this.data = data;
				this.text = "M\n(" + this.key + "," + data + ")";
				return oldData;
			}
		}

		copy() {
			// there shouldnt be any copying
		}
	}

	return Mod;
});