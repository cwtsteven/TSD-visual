define(function(require) {

	var Node = require('node');

	class Expo extends Node {

		constructor(shape, text, name) {
			super(shape, text, name);
			this.width = ".3";
			this.height = ".3";
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0];
				return this.checkLinkState(nextLink, function() {
					return nextLink;
				});
			}
			else if (link.from == this.key) {
				var nextLink = this.findLinksInto(null)[0];
				nextLink.state = State.O;
				return nextLink;
			}
		}

		deleteAndPreserveInLink() { 
			var inLink = this.findLinksInto(null)[0];
			var outLink = this.findLinksOutOf(null)[0];
			if (outLink != null && inLink != null) {
				inLink.changeTo(outLink.to, outLink.toPort);
				inLink.state = outLink.state;
			}
			super.delete();
		}

		deleteAndPreserveOutLink() { 
			var inLink = this.findLinksInto(null)[0];
			var outLink = this.findLinksOutOf(null)[0];
			if (inLink != null && outLink != null) {
				outLink.changeFrom(inLink.from, inLink.fromPort);
			}
			super.delete();
		}
	}

	return Expo;
});