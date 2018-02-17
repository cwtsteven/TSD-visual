define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var State = require('link').State();
	var Promo = require('nodes/promo');
	var Weak = require('nodes/weak');

	class If extends Node {

		constructor() {
			super(null, "if");
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("w")[0];
				return this.checkLinkState(nextLink, function() {
					token.dataStack.push(CompData.PROMPT);
					return nextLink;
				});
			}
			else if (link.from == this.key && link.fromPort == "w") {
				if (token.dataStack.last() == true) {
					var nextLink = this.findLinksOutOf("n")[0];
					return this.checkLinkState(nextLink, function() {
						token.dataStack.pop();
						token.rewriteFlag = RewriteFlag.F_IF;
						token.forward = true;
						return nextLink;
					});
				}
				else if (token.dataStack.last() == false) {
					var nextLink = this.findLinksOutOf("e")[0];
					return this.checkLinkState(nextLink, function() {
						token.dataStack.pop();
						token.rewriteFlag = RewriteFlag.F_IF;
						token.forward = true;
						return nextLink;
					});
				}
			} 
			else if (link.from == this.key) {
				var nextLink = this.findLinksInto(null)[0];
				nextLink.state = State.O;
				return nextLink;
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