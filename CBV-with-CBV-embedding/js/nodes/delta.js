class Delta extends Node {

	constructor() {
		super(null, "Δ");
	}
	
	transition(token, link) {
		if (link.to == this.key) {
			token.dataStack.push(CompData.PROMPT);
			token.modStack.push(ModData.NOCOPY);
			return this.findLinksOutOf("e")[0];
		}
		else if (link.from == this.key) {
			if (link.fromPort == "e") {
				token.dataStack.pop();
				token.dataStack.push(this.key);
				token.dataStack.push(CompData.DELTA);
				token.modStack.pop();
				token.forward = true;
				return this.findLinksOutOf("w")[0];
			}
			else if (link.fromPort == "w") {
				token.dataStack.pop();
				token.dataStack.push("()");
				token.rewriteFlag = RewriteFlag.F_DELTA;
				return this.findLinksInto(null)[0];
			}
		}
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_DELTA && nextLink.to == this.key) {
			token.rewriteFlag = RewriteFlag.EMPTY;
			var data = token.dataStack.last();
			var weak1 = new Weak().addToGroup(this.group);
			var weak2 = new Weak().addToGroup(this.group);
			this.findLinksOutOf("w")[0].changeFrom(weak1.key, "n");
			this.findLinksOutOf("e")[0].changeFrom(weak2.key, "n");
			var wrapper = BoxWrapper.create().addToGroup(this.group);
			var con = new Const(data).addToGroup(wrapper.box);
			var newLink = new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
			this.findLinksInto(null)[0].changeTo(wrapper.prin.key, "s");
			this.delete();

			token.rewriteFlag = RewriteFlag.F_PROMO;
			token.rewrite = true;
			return newLink;
		}

		else if (token.rewriteFlag == RewriteFlag.EMPTY) {
			token.rewrite = false;
			return nextLink;
		}
	}

	analyse(token) {
		token.machine.analysisToken.splice(token.machine.analysisToken.indexOf(token), 1);
		return null;
	}

	copy() {
		return new Delta();
	}
}