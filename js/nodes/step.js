define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var BoxWrapper = require('box-wrapper');
	var Const = require('nodes/const');
	var Link = require('link');
	var Pair = require('token').Pair();

	class Step extends Node {
		
		constructor() {
			super(null, "s", "indianred1");
		}

		transition(token, link) {
			if (link.to == this.key) {
				if (token.dataStack.last() == CompData.PROMPT) {
					token.rewriteFlag = RewriteFlag.F_SP;
					token.machine.startPropagation();
					return link; 
				}
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_STEP && nextLink.to == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;
				var data = token.machine.hasUpdate; 
				token.dataStack.pop();
				token.dataStack.push(new Pair(data,CompData.EMPTY));
				var wrapper = BoxWrapper.create().addToGroup(this.group);
				var con = new Const(data).addToGroup(wrapper.box);
				new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
				nextLink.changeTo(wrapper.prin.key, "s");
				this.delete();

				token.rewrite = true;
				token.forward = false;
				return nextLink;
			}

			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			return new Step();
		}
	}

	return Step;
});