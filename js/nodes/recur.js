define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Term = require('term');

	class Recur extends Node {

		constructor() {
			super(null, "μ", "yellow");
		}

		transition(token, link) {
			if (link.to == this.key) {
				//var nextLink = this.findLinksOutOf("e")[0];
				token.rewriteFlag = RewriteFlag.F_RECUR;
				return link;
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_RECUR && nextLink.to == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var promo = this.graph.findNodeByKey(this.findLinksInto()[0].from);
				var wrapper = promo.group.copy().addToGroup(promo.group.group);
				Term.joinAuxs(promo.group.auxs, wrapper.auxs, wrapper.group);	

				var oldGroup = promo.group; 
				
				oldGroup.moveOut();
				oldGroup.deleteAndPreserveLink(); 

				var leftLink = this.findLinksInto("w")[0];
				leftLink.changeTo(wrapper.prin.key, "s");
				leftLink.fromPort = "n";
				leftLink.reverse = false; 
				var inLink = this.findLinksInto("s")[0];
				var outLink = this.findLinksOutOf("e")[0];
				outLink.changeFrom(inLink.from, inLink.fromPort);
				
				this.delete(); 

				token.rewrite = true;
				return outLink;
			}

			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			return new Recur();
		}
	}

	return Recur;
});