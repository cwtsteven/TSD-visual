define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var BoxWrapper = require('box-wrapper');
	var Const = require('nodes/const');
	var Link = require('link');
	var Contract = require('nodes/contract');
	var Pair = require('token').Pair();

	class Linking extends Node {

		constructor() {
			super(null, "l", "indianred1");
		}
		
		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("e")[0];
				//token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key) {
				if (link.fromPort == "e") {
					var nextLink = this.findLinksOutOf("w")[0];
					//token.dataStack.pop();
					token.dataStack.push(CompData.PROMPT);
					token.forward = true; 
					return nextLink;
				}
				else if (link.fromPort == "w") {
					var data = token.dataStack.pop();
					token.dataStack.pop();
					token.payload = data; 
					token.dataStack.push(new Pair(CompData.UNIT,CompData.EMPTY));
					token.rewriteFlag = RewriteFlag.F_DELTA;
					return this.findLinksInto(null)[0];
				}
			}
		}

		rewrite(token, nextLink) { 
			if (token.rewriteFlag == RewriteFlag.F_DELTA && nextLink.to == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var key = token.payload.b;
				token.payload = null;

				var data = token.dataStack.last();
				var weak1 = new Contract().addToGroup(this.group);
				this.findLinksOutOf("w")[0].changeFrom(weak1.key, "n");

				var mod = this.graph.findNodeByKey(key);

				var weak2 = new Contract().addToGroup(this.group);
				mod.findLinksOutOf(null)[0].changeFrom(weak2.key, 'n');
				this.findLinksOutOf("e")[0].changeFrom(mod.key, "n");

				var wrapper = BoxWrapper.create().addToGroup(this.group);
				var con = new Const(data.a).addToGroup(wrapper.box);
				new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
				this.findLinksInto(null)[0].changeTo(wrapper.prin.key, "s");
				this.delete();
				
				token.rewrite = true;
				return nextLink;
			}

			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			return new Linking();
		}
	}

	return Linking;
});