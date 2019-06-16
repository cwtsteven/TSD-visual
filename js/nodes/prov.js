define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Mod = require('nodes/mod');
	var Dependency = require('nodes/depend');
	var Const = require('nodes/const');
	var Link = require('link');
	var Pair = require('token').Pair();

	class Prov extends Node {
		
		constructor() {
			super('circle', 'm', "indianred1");
			//this.width = ".3";
			//this.height = ".3";
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0];
				token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key) {
				var data = token.dataStack.pop();
				token.dataStack.pop();
				token.dataStack.push(data);
				token.rewriteFlag = RewriteFlag.F_MOD;
				return this.findLinksInto(null)[0];
			}
		}

		rewrite(token, nextLink) {
			if (nextLink.to == this.key && token.rewriteFlag == RewriteFlag.F_MOD) {
				token.rewriteFlag = RewriteFlag.EMPTY;
				var data = token.dataStack.pop();

				//if ((isNumber(data[0]) || typeof(data[0]) === "boolean")) {
					var mod = new Mod(data.a).addToGroup(this.group);
					var dep = new Dependency(mod.key).addToGroup(this.group);
					mod.dep_key = dep.key;
					var outLink = this.findLinksOutOf(null)[0];
					outLink.changeFrom(dep.key, "n");
					var inLink = this.findLinksInto(null)[0];
					inLink.changeTo(mod.key, "s");
					this.delete();
					token.rewrite = true;  
					token.dataStack.push(new Pair(data.a,mod.key)); 
				//}
				
				return nextLink;
			}

			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		deleteAndPreserveInLink() { 
			var inLink = this.findLinksInto(null)[0];
			var outLink = this.findLinksOutOf(null)[0];
			if (outLink != null && inLink != null) {
				inLink.changeTo(outLink.to, outLink.toPort);
			}
			super.delete();
		}

		copy() {
			return new Prov();
		}
	}

	return Prov;
});