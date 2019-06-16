define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var BoxWrapper = require('box-wrapper');
	var Const = require('nodes/const');
	var Link = require('link');
	var Weak = require('nodes/weak');
	var Pair = require('token').Pair();

	class Dep extends Node {
		
		constructor() {
			super(null, 'p', "mediumpurple1");
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0]; 
				token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key) {
				if (token.dataStack[token.dataStack.length-2] == CompData.PROMPT) {
					var data = token.dataStack.pop();
					token.dataStack.pop();
					token.dataStack.push(new Pair(data.a,CompData.EMPTY));
					token.rewriteFlag = RewriteFlag.F_DEP;
					return this.findLinksInto(null)[0]; 
				}
			}
		}

		rewrite(token, nextLink) {
			if (nextLink.to == this.key && token.rewriteFlag == RewriteFlag.F_DEP) {
				token.rewriteFlag = RewriteFlag.EMPTY;
				var data = token.dataStack.last();

				//if ((isNumber(data.a) || typeof(data.a) === "boolean") || typeof(data.a) === "array") {
					var outLink = this.findLinksOutOf(null)[0]; 
					var weak = new Weak(outLink.text).addToGroup(this.group);
					outLink.changeFrom(weak.key, "n");

					var wrapper = BoxWrapper.create().addToGroup(this.group);
					var newConst = new Const(data.a.toString()).addToGroup(wrapper.box);
					console.log("here");
					console.log(newConst);
					new Link(wrapper.prin.key, newConst.key, "n", "s").addToGroup(wrapper);
					nextLink.changeTo(wrapper.prin.key, "s");
					
					this.delete();
					token.rewrite = true;
				//}

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