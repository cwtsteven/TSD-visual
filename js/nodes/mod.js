define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Delta = require('nodes/delta');
	var Weak = require('nodes/weak');
	var Contract = require('nodes/contract');

	class Mod extends Node {
		
		constructor() {
			super(null, "M", "indianred1");
			this.graph.machine.cells.push(this.key);
		}

		transition(token, link) {
			if (link.to == this.key) {
				return this.findLinksOutOf("w")[0];
			}
			else if (link.from == this.key && link.fromPort == "w") {
				var data = token.dataStack.pop();
				token.dataStack.push([data[0],this.key])
				return this.findLinksInto(null)[0]; 
			}
			else if (link.from == this.key && link.fromPort == "e") {
				token.machine.newValues.set(this.key, token.dataStack.last()[0]);
				token.delete();
				return null;
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

		copy() {
			var mod = new Mod();
			return mod;
		}
	}

	return Mod;
});