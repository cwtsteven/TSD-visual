define(function(require) {

	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Term = require('term');
	var Link = require('link');
	var Expo = require('nodes/expo');
	var Der = require('nodes/der');
	var Contract = require('nodes/contract');

	class Promo extends Expo {

		constructor() {
			super(null, "!");
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0];
				token.rewriteFlag = RewriteFlag.F_PROMO;
				return nextLink;
			}
			else if (link.from == this.key) {
				var nextLink = this.findLinksInto(null)[0];
				return nextLink;
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_PROMO) {
				token.rewriteFlag = RewriteFlag.EMPTY;
				var prev = this.graph.findNodeByKey(this.findLinksInto(null)[0].from);

				if (prev instanceof Der) {
					var oldGroup = this.group;
					oldGroup.moveOut(); // this.group is a box-wrapper
					oldGroup.deleteAndPreserveLink();
					var newNextLink = prev.findLinksInto(null)[0];
					prev.deleteAndPreserveInLink(); // preserve inLink
					
					token.rewrite = true;
					return newNextLink;
				}
				else if (prev instanceof Contract && token.boxStack.length >= 1) {
					if (nextLink.from == this.key) {
						var link = token.boxStack.pop();
						var inLinks = prev.findLinksInto(null);
						if (inLinks.length == 1) { 
							// this will not happen as the C-node should have taken care of it
							link.changeTo(this.key, "s");
							prev.delete();
						}
						else {
							var newBoxWrapper = this.group.copy().addToGroup(this.group.group);
							Term.joinAuxs(this.group.auxs, newBoxWrapper.auxs, newBoxWrapper.group);
							var prevLink = prev.findLinksOutOf(null)[0];
							prevLink.changeTo(newBoxWrapper.prin.key, prev.findLinksOutOf(null)[0].toPort);
							link.changeTo(this.key, "s");
						}
						token.rewriteFlag = RewriteFlag.F_PROMO;
						token.rewrite = true;
						return nextLink;
					}
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
			return new Promo();
		}
	}

	return Promo;
});