var ModType = {
	M: 'M',
	R: 'R',
}

class Mod extends Node {
	
	constructor() {
		super(null, "M");
		this.type = ModType.M;
	}

	deleteAndPreserveInLink() { 
		var inLink = this.findLinksInto(null)[0];
		var outLink = this.findLinksOutOf("w")[0];
		if (outLink != null && inLink != null) {
			inLink.changeTo(outLink.to, outLink.toPort);
		}
		super.delete();
	}

	deleteAndPreserveOutLink() { 
		var inLink = this.findLinksInto(null)[0];
		var outLink = this.findLinksOutOf("w")[0];
		if (inLink != null && outLink != null) {
			outLink.changeFrom(inLink.from, inLink.fromPort);
		}
		super.delete();
	}

	transition(token, link) {
		if (link.to == this.key) {
			var data = token.dataStack.last();

			if (data == CompData.DELTA) {
				token.dataStack.pop();
				token.rewriteFlag = RewriteFlag.F_MODIFY;
				return this.findLinksOutOf("e")[0];
			}
			else if (data == CompData.PROMPT) {
				token.rewriteFlag = RewriteFlag.F_MPROMO;
				return this.findLinksOutOf("w")[0];
			}
			else if (data == CompData.R) {
				if (token.modStack.last() != ModData.NOCOPY) {
					token.rewriteFlag = RewriteFlag.F_MPROMO;
					return this.findLinksOutOf("w")[0];
				}
				token.dataStack.pop();
				token.dataStack.push(this.findLinksOutOf("w")[0].to);
				token.dataStack.push(CompData.M);
				token.forward = false;
				return link;
			}
		}
		else if (link.from == this.key && link.fromPort == "w") {
			if (token.modStack.last() == this.key)
				token.modStack.pop();
			return this.findLinksInto(null)[0];
		}
		else if (link.from == this.key && link.fromPort == "e") {
			return this.findLinksInto(null)[0];
		}
	}

	rewrite(token, nextLink) {
		if (nextLink.from == this.key) {
			if (token.rewriteFlag == RewriteFlag.F_MPROMO) {
				token.rewriteFlag = RewriteFlag.EMPTY;
				var prev = this.graph.findNodeByKey(this.findLinksInto(null)[0].from);

				if (token.modStack.last() != ModData.NOCOPY) {
					if (prev instanceof Der) { 
						var righLink = this.findLinksOutOf("e")[0];
						var weak = new Weak(this.graph.findNodeByKey(righLink.to).name).addToGroup(this.group);
						righLink.changeFrom(weak.key, "n");

						var inLink = this.findLinksInto(null)[0];
						nextLink.changeFrom(inLink.from, inLink.fromPort);
						this.delete();

						token.rewrite = true;
						return nextLink;
					}
					else if (prev instanceof Pax) {
						/*
						if (token.modStack.last() != ModData.NOCOPY) {
							var righLink = this.findLinksOutOf("e")[0];
							var weak = new Weak(this.graph.findNodeByKey(righLink.to).name).addToGroup(this.group.group);
							righLink.changeFrom(weak.key, "n");

							this.group.changeToGroup(prev.group.box);
							prev.group.auxs = prev.group.auxs.concat(prev.group.createPaxsOnTopOf(this.group.auxs));
							var inLink = prev.findLinksInto(null)[0];
							var promoInLink = this.findLinksInto(null)[0];
							promoInLink.changeFrom(inLink.from, inLink.fromPort);
							promoInLink.changeToGroup(this.group.group); // the box
							prev.group.removeAux(prev); // preserve outLink

							var promo = new Promo().addToGroup(this.group);
							this.group.prin = promo;
							this.findLinksOutOf("w")[0].changeFrom(promo.key, "n");
							promoInLink.changeTo(promo.key, "s");

							this.delete();

							token.at = nextLink.from;
							token.rewrite = true;
							return nextLink;
						}
						*/
					}
					else if (prev instanceof Contract && token.boxStack.length >= 1) {
						var link = token.boxStack.pop();
						var inLinks = prev.findLinksInto(null);
						if (inLinks.length == 1) { 
							// this will not happen as the C-node should have taken care of it
						}
						else {
							var leftNode = this.graph.findNodeByKey(nextLink.to);
							var newBoxWrapper = leftNode.group.copy().addToGroup(this.group);
							Term.joinAuxs(leftNode.group.auxs, newBoxWrapper.auxs, newBoxWrapper.group);
							link.changeTo(newBoxWrapper.prin.key, "s");
						}
						token.rewrite = true;
						token.rewriteFlag = RewriteFlag.F_PROMO;
						return newBoxWrapper.prin.findLinksOutOf(null)[0];	
					}
				}
			}

			else if (token.rewriteFlag == RewriteFlag.F_MODIFY) {
				var key = token.dataStack.pop();
				var node = this.graph.findNodeByKey(key);
				var weak = new Weak().addToGroup(this.group);
				new Link(weak.key, nextLink.to, "n", "s").addToGroup(this.group);
				if (node instanceof Promo) {
					var wrapper = node.group.copy().addToGroup(this.group);
					Term.joinAuxs(node.group.auxs, wrapper.auxs, wrapper.group);
					nextLink.changeTo(wrapper.prin.key, "s");
				}
				else {
					nextLink.changeTo(node.key, "s");
				}

				this.changeType(ModType.R);

				token.rewriteFlag = RewriteFlag.EMPTY;
				token.forward = false;
				token.rewrite = true;
				return nextLink;
			}
		}

		token.rewriteFlag = RewriteFlag.EMPTY;
		token.rewrite = false;
		return nextLink;
	}

	changeType(type) {
		this.type = type;
		this.text = type;
	}

	copy() {
		return new Mod();
	}

}