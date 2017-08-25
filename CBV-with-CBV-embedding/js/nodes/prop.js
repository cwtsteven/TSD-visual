class Prop extends Node {
	
	constructor() {
		super(null, "P");
	}

	transition(token, link) {
		if (link.to == this.key) {
			if (!token.machine.propagating) {
				token.machine.startAnalysis();
			}
			token.rewriteFlag = RewriteFlag.F_PROP;
			token.forward = false;
			token.dataStack.pop();
			token.dataStack.push("()");
			return link;
		}
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_PROP && nextLink.to == this.key) {
			token.rewriteFlag = RewriteFlag.EMPTY;
			var wrapper = BoxWrapper.create().addToGroup(this.group);
			var con = new Const(token.dataStack.last()).addToGroup(wrapper.box);
			var newLink = new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
			nextLink.changeTo(wrapper.prin.key, "s");
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

	copy() {
		return new Prop();
	}
}