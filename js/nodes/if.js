define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Promo = require('nodes/promo');
	var Weak = require('nodes/weak');

	class If extends Node {

		constructor() {
			super(null, "if");
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("w")[0];
				token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key && link.fromPort == "w") {
				var left = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);
				if (left instanceof Promo) {
					if (token.dataStack.last()[0] == true) {
						var nextLink = this.findLinksOutOf("n")[0];
						token.dataStack.pop();
						token.rewriteFlag = RewriteFlag.F_IF;
						token.forward = true;
						return nextLink; 
					}
					else if (token.dataStack.last()[0] == false) {
						var nextLink = this.findLinksOutOf("e")[0];
						token.dataStack.pop();
						token.rewriteFlag = RewriteFlag.F_IF;
						token.forward = true;
						return nextLink; 
					}
				}
				else {
					var nextLink = this.findLinksOutOf("n")[0];
					var data = token.dataStack.pop();
					token.dataStack.push(data[0]);
					token.dataStack.push(CompData.PROMPT);
					token.forward = true;
					return nextLink; 
				}
			} 
			else if (link.from == this.key) {
				if (link.fromPort == "n") {
					var nextLink = this.findLinksOutOf("e")[0];
					token.dataStack.push(CompData.PROMPT);
					token.forward = true;
					return nextLink; 
				}
				else if (link.fromPort == "e") {
					var nextLink = this.findLinksInto("s")[0];
					var y = token.dataStack.pop();
					var x = token.dataStack.pop();
					var cond = token.dataStack.pop();
					var result;
					if (cond) 
						result = x;
					else
						result = y;
					token.dataStack.pop();
					token.dataStack.push(result);
					token.forward = false;
					return nextLink; 
				}
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_IF && nextLink.from == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var left = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);
				if (left instanceof Promo) {
					var downLink = this.findLinksInto(null)[0];
					var otherLink = this.findLinksOutOf(nextLink.fromPort == "n"?"e":"n")[0];
					nextLink.changeFrom(downLink.from, downLink.fromPort);
					var weak = new Weak(this.graph.findNodeByKey(otherLink.to).name).addToGroup(this.group);
					otherLink.changeFrom(weak.key, "n");
					this.delete();
					left.group.delete();
				}
				
				token.rewrite = true;
				return nextLink;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			return new If();
		}
	}

	return If;
});