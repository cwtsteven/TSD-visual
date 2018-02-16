define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Delta = require('nodes/delta');
	var Weak = require('nodes/weak');
	var Contract = require('nodes/contract');

	class Mod extends Node {
		
		constructor() {
			super(null, "M");
			this.graph.machine.cells.push(this.key);
		}

		transition(token, link) {
			if (link.to == this.key) {
				var data = token.dataStack.last();

				if (data == CompData.DELTA) {
					token.dataStack.pop();
					token.rewriteFlag = RewriteFlag.F_DELTA;
					return this.findLinksOutOf("e")[0];
				}

				else {
					return this.findLinksOutOf("w")[0];
				}
			}
			else if (link.from == this.key && link.fromPort == "w") {
				return this.findLinksInto(null)[0];
			}
			else if (link.from == this.key && link.fromPort == "e") {
				if (token.machine.evaluating) {
					token.machine.newValues.set(this.key, token.dataStack.last());
					token.delete();
					return null;
				}
				
				return this.findLinksInto(null)[0];
			}
		}

		update(data) {
			var leftLink = this.findLinksOutOf("w")[0];

			if ((isNumber(data) || typeof(data) === "boolean")) {
				var value = this.graph.findNodeByKey(leftLink.to);
				var oldData = value.name;
				value.text = data;
				value.name = data;
				return oldData;
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_DELTA && nextLink.from == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				token.dataStack.push(CompData.NABLA + '(' + this.key + ')');

				token.forward = false;
				token.rewrite = true;
				return nextLink;
			}

			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			var mod = new Mod();
			return mod;
		}
	}

	return Mod;
});