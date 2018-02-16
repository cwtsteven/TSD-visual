define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var BoxWrapper = require('box-wrapper');
	var Const = require('nodes/const');
	var Link = require('link');
	var Weak = require('nodes/weak');

	class Dep extends Node {
		
		constructor() {
			super(null, 'dep');
		}

		transition(token, link) {
			if (link.to == this.key) {
				token.dataStack.push(CompData.PROMPT);
				return this.findLinksOutOf(null)[0];
			}
			else if (link.from == this.key) {
				if (token.dataStack[token.dataStack.length-2] == CompData.PROMPT) {
					var data = token.dataStack.pop();
					token.dataStack.pop();
					token.dataStack.push(data);
					token.rewriteFlag = RewriteFlag.F_DEP;
					return this.findLinksInto(null)[0];
				}
			}
		}

		rewrite(token, nextLink) {
			if (nextLink.to == this.key && token.rewriteFlag == RewriteFlag.F_DEP) {
				token.rewriteFlag = RewriteFlag.EMPTY;
				var data = token.dataStack.last();

				if ((isNumber(data) || typeof(data) === "boolean")) {
					var outLink = this.findLinksOutOf(null)[0]; 
					var weak = new Weak(outLink.text).addToGroup(this.group);
					outLink.changeFrom(weak.key, "n");

					var wrapper = BoxWrapper.create().addToGroup(this.group);
					var newConst = new Const(data).addToGroup(wrapper.box);
					new Link(wrapper.prin.key, newConst.key, "n", "s").addToGroup(wrapper);
					nextLink.changeTo(wrapper.prin.key, "s");
					
					this.delete();
					token.rewrite = true;
				}

				return nextLink;
			}

			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			return new Dep();
		}
	}

	return Dep;
});