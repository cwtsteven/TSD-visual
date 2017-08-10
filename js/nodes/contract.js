class Contract extends Expo {

	constructor(name) {
		super(null, "C", name);
	}

	transition(token, link) {
		if (link.to == this.key) {
			token.boxStack.push(link);
			token.rewriteFlag = RewriteFlag.F_C;
			return this.findLinksOutOf(null)[0];
		}
		else if (link.from == this.key && token.boxStack.length > 0) {
			return token.boxStack.pop();
		}
	}

	rewrite(token, nextLink) {
		if (nextLink.from == this.key) {
			if (token.rewriteFlag == RewriteFlag.F_C) {
				if (this.findLinksInto(null).length == 1) {
					token.boxStack.pop();
					var inLink = this.findLinksInto(null)[0];
					nextLink.changeFrom(inLink.from, inLink.fromPort);
					this.delete();
					token.rewriteFlag = RewriteFlag.EMPTY;
					token.at = nextLink.from;
					token.rewrite = true;
					return nextLink;
				}
				else if (token.boxStack.length >= 2) {
					var j = token.boxStack.last();
					var prev2 = this.graph.findNodeByKey(j.from);
					if (prev2 instanceof Contract) {
						token.boxStack.pop();
						var i = token.boxStack.last();
						for (let link of prev2.findLinksInto(null)) {
							link.changeTo(prev.key, "s");
						}
						prev2.delete();
						token.at = nextLink.from;
						token.rewrite = true;
						return nextLink;
					}
				}
				else if (token.boxStack.length == 1) {
					token.rewriteFlag = RewriteFlag.EMPTY;
					return nextLink;
				}
			}
			token.rewriteFlag = RewriteFlag.EMPTY;
			token.rewrite = false;
			return nextLink;
		}
	}

	copy() {
		var con = new Contract(this.name);
		con.text = this.text;
		return con;
	}
}