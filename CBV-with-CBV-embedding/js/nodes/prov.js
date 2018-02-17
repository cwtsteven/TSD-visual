define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var State = require('link').State();
	var Mod = require('nodes/mod');
	var Const = require('nodes/const');
	var Link = require('link');

	class Prov extends Node {
		
		constructor() {
			super('diamond', '');
			this.width = ".3";
			this.height = ".3";
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0];
				return this.checkLinkState(nextLink, function() {
					token.dataStack.push(CompData.PROMPT);
					return nextLink;
				});
			}
			else if (link.from == this.key) {
				var data = token.dataStack.pop();
				var data2 = token.dataStack.pop();
				token.dataStack.push(data);
				if (data2[0] == CompData.DELTA)
					token.dataStack.push(CompData.NABLA);
				token.rewriteFlag = RewriteFlag.F_MOD;
				return this.findLinksInto(null)[0];
			}
		}

		rewrite(token, nextLink) {
			if (nextLink.to == this.key && token.rewriteFlag == RewriteFlag.F_MOD) {
				token.rewriteFlag = RewriteFlag.EMPTY;
				var data = token.dataStack.last();

				if (data == CompData.NABLA) {
					token.dataStack.pop();
					data = token.dataStack.pop();
					token.dataStack.push(CompData.DELTA);
					token.forward = true; 
				}

				if ((isNumber(data) || typeof(data) === "boolean")) {
					var mod = new Mod().addToGroup(this.group);
					var con = new Const(data).addToGroup(this.group);
					new Link(mod.key, con.key, "w", "s").addToGroup(this.group).state = State.O;
					var outLink = this.findLinksOutOf(null)[0];
					outLink.changeFrom(mod.key, "e");
					var inLink = this.findLinksInto(null)[0];
					inLink.changeTo(mod.key, "s");
					this.delete();
					token.rewrite = true;
				}
				
				nextLink.state = State.O;
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