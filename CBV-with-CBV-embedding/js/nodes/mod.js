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
				token.dataStack.push(CompData.LAMBDA);
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
					else if (prev instanceof Contract && token.boxStack.length >= 1) {
						var link = token.boxStack.last();
						var inLinks = prev.findLinksInto(null);
						if (inLinks.length == 1) { 
							// this will not happen as the C-node should have taken care of it
						}
						else {
							var leftNode = this.graph.findNodeByKey(nextLink.to);
							var con = new Contract(leftNode.name).addToGroup(this.group);
							nextLink.changeFrom(con.key, "n");
							new Link(this.key, con.key, "w", "s").addToGroup(this.group);
							link.changeTo(con.key, "s");
						}
						token.rewrite = true;
						token.rewriteFlag = RewriteFlag.F_C;
						return nextLink;
					}
				}
			}

			else if (token.rewriteFlag == RewriteFlag.F_MODIFY) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var link = token.dataStack.pop();
				var toNode = this.graph.findNodeByKey(link.to);
				var delta = this.graph.findNodeByKey(link.from);
				var weak = new Weak().addToGroup(this.group);
				new Link(weak.key, nextLink.to, "n", "s").addToGroup(this.group);
				var con = new Contract(toNode.name).addToGroup(this.group);
				nextLink.changeTo(con.key, "s");
				new Link(delta.key, con.key, link.fromPort, "s").addToGroup(this.group);
				link.changeFrom(con.key, "n");

				this.changeType(ModType.R);

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