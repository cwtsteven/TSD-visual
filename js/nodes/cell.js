define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Pair = require('token').Pair();

	class Cell extends Node {

		constructor(n) {
			super(null, "", "indianred1");
			this.data = n;
			this.update(n);
			this.graph.machine.cells.push(this.key);
		}

		transition(token, link) {
			if (link.to == this.key) {
				token.dataStack.pop();
				token.dataStack.push(new Pair(this.data,this.key));
				token.forward = false;
				return link;
			}
			else if (link.from == this.key) {
				token.machine.newValues.set(this.key, token.dataStack.last().a);
				token.delete();
				return null;
			}
		} 

		update(data) {
			if ((isNumber(data) || typeof(data) === "boolean")) {
				var oldData = this.data;
				this.data = data;
				this.text = "{" + data + "}";
				return oldData;
			}
		}

		copy() {
			// there shouldnt be any copying
		}
	}

	return Cell;
});