class If1 extends Node {
	constructor() {
		super(null, "if-1");
	}

	transition(token, link) {
		if (link.to == this.key) {
			token.rewriteFlag == RewriteFlag.F_IF
			return this.findLinksOutOf("n")[0];
		}
		else if (link.from == this.key && link.fromPort == "n") {
			return this.findLinksInto(null)[0];
		} 
	}

	rewrite(token, nextLink) {
		if (nextLink.from == this.key) {
			if (token.rewriteFlag == RewriteFlag.F_IF && token.modStack.last() != ModData.NOCOPY) {
				token.rewriteFlag == RewriteFlag.EMPTY;

				var downLink = this.findLinksInto(null)[0];
				var otherLink = this.findLinksOutOf(nextLink.fromPort == "e")[0];
				nextLink.changeFrom(downLink.from, downLink.fromPort);
				var weak = new Weak(this.graph.findNodeByKey(otherLink.to).name).addToGroup(this.group);
				otherLink.changeFrom(weak.key, "n");
				var leftLink = this.findLinksOutOf("w")[0];
				var weak2 = new Weak(this.graph.findNodeByKey(leftLink.to).name).addToGroup(this.group);
				leftLink.changeFrom(weak2.key, "n");
				this.delete();

				token.rewrite = true;
				return nextLink;
			}
		}
		token.rewriteFlag = RewriteFlag.EMPTY;
		token.rewrite = false;
		return nextLink;
	}

	copy() {
		return new If1();
	}
}