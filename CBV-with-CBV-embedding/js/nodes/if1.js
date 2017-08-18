class If1 extends Node {
	constructor() {
		super(null, "if-1");
	}

	transition(token, link) {
		if (link.to == this.key) {
			token.dataStack.push(CompData.PROMPT);
			return this.findLinksOutOf("n")[0];
		}
		else if (link.from == this.key && link.fromPort == "n") {
			token.rewriteFlag = RewriteFlag.F_MOD;
			return this.findLinksInto(null)[0];
		} 
	}

	rewrite(token, nextLink) {
		if (nextLink.to == this.key) {
			if (token.rewriteFlag == RewriteFlag.F_MOD) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var data = token.dataStack.pop();
				if (data == CompData.LAMBDA) {
					var outLink = this.findLinksOutOf("n")[0];
					var node = this.graph.findNodeByKey(outLink.to);
					var mod = new Mod().addToGroup(this.group);
					var con = new Contract().addToGroup(this.group);
					outLink.changeFrom(con.key, "n");
					new Link(mod.key, con.key, "w", "s").addToGroup(this.group);
					new Link(this.key, con.key, "n", "s").addToGroup(this.group);
					var newLink = new Link(nextLink.from, mod.key, nextLink.fromPort, "s").addToGroup(this.group);
					nextLink.changeFrom(mod.key, "e");
					token.rewrite = true;
				}
				else
					token.rewrite = false;

				token.dataStack.pop();
				token.dataStack.push(data);
				return newLink;
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