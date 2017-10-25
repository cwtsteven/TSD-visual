class If1 extends Node {
	constructor() {
		super(null, "if-1");
	}

	transition(token, link) {
		if (link.to == this.key) {
			return this.findLinksOutOf("n")[0];
		}
		else if (link.from == this.key && link.fromPort == "n") {
			token.rewriteFlag = RewriteFlag.F_INTER;
			return this.findLinksInto(null)[0];
		} 
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_INTER) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			var prev = this.graph.findNodeByKey(this.findLinksInto(null)[0].from);
			if (prev instanceof Mod || prev instanceof BinOp || prev instanceof UnOp || prev instanceof If || prev instanceof If1 || prev instanceof If2 || prev instanceof Der || prev instanceof Prov) {

			}

			else {
				var data = token.dataStack.last();
				if ((Number.isInteger(data) || typeof(data) === "boolean")) {
					var mod = new Inter().addToGroup(this.group);
					var wrapper = BoxWrapper.create().addToGroup(mod.group);
					var con = new Const(data).addToGroup(wrapper.box);
					new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
					new Link(mod.key, wrapper.prin.key, "w", "s").addToGroup(this.group);
					var inLink = this.findLinksInto(null)[0];
					inLink.changeTo(mod.key, "s");
					new Link(mod.key, this.key, "e", "s").addToGroup(this.group);
					token.rewrite = true;
				}
				else if (data == CompData.LAMBDA) {
					var outNode = this.graph.findNodeByKey(this.findLinksOutOf("n")[0].to);
					var promo = this.searchForPromo(outNode);
					var promoCopy = promo.group.deepCopy(this.group)
					
					var mod = new Mod().addToGroup(this.group);
					new Link(mod.key, promoCopy.prin.key, "w", "s").addToGroup(this.group);
					new Link(mod.key, this.key, "e", "s").addToGroup(this.group);
					var inLink = this.findLinksInto(null)[0];
					inLink.changeTo(mod.key, "s");
					token.rewrite = true;
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

	analyse(token) {
		if (token.link.fromPort == "w") {
			var newIf = new If().addToGroup(this.group);
			for (let link of this.findLinksOutOf(null)) {
				link.changeFrom(newIf.key, link.fromPort);
			}
			this.findLinksInto(null)[0].changeTo(newIf.key, "s");
			this.delete();
			return token.link;
		}

		else if (token.link.fromPort == "n") {
			return this.findLinksInto(null)[0];
		}

		else if (token.link.fromPort == "e") {
			this.halt = true;
			return token.link;
		}
	}

	copy() {
		return new If1();
	}
}