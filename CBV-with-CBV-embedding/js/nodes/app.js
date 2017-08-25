class App extends Node {

	constructor() {
		super(null, "@");
	}
	
	transition(token, link) {
		if (link.to == this.key) {
			token.dataStack.push(CompData.PROMPT);
			return this.findLinksOutOf("e")[0];
		}
		else if (link.from == this.key && link.fromPort == "e") {
			token.rewriteFlag = RewriteFlag.F_MOD;
			token.forward = true;
			return this.findLinksOutOf("w")[0];
		}
		else if (link.from == this.key && link.fromPort == "w") {
			token.rewriteFlag = RewriteFlag.F_MOD;
			return this.findLinksInto(null)[0];
		}
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_MOD) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			if (nextLink.from == this.key && nextLink.fromPort == "w") {
				var data = token.dataStack.last();
				var rightLink = this.findLinksOutOf("e")[0];
				var prev = this.graph.findNodeByKey(rightLink.to);
				if (prev instanceof Promo || prev instanceof Mod || prev instanceof Contract) {

				}
				else if ((Number.isInteger(data) || typeof(data) === "boolean")) {
					var right;
					if (prev instanceof Prov) {
						right = this.graph.findNodeByKey(prev.findLinksOutOf(null)[0].to);
						prev.deleteAndPreserveInLink();
					}
					else
						right = prev;

					var mod = new Mod().addToGroup(this.group);
					var wrapper = BoxWrapper.create().addToGroup(mod.group);
					var con = new Const(data).addToGroup(wrapper.box);
					new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
					new Link(mod.key, wrapper.prin.key, "w", "s").addToGroup(this.group);
					var inLink = right.findLinksInto(null)[0];
					new Link(inLink.from, mod.key, inLink.fromPort, "s").addToGroup(mod.group);
					inLink.changeFrom(mod.key, "e");
					token.rewrite = true;
				}
				else if (data == CompData.LAMBDA) {
					var right;
					if (prev instanceof Prov) {
						right = this.graph.findNodeByKey(prev.findLinksOutOf(null)[0].to);
						prev.deleteAndPreserveInLink();
					}
					else
						right = prev;
					
					var inLink = right.findLinksInto(null)[0];
					var mod = new Mod().addToGroup(this.group);
					var con = new Contract(right.name).addToGroup(this.group);
					new Link(inLink.from, mod.key, inLink.fromPort, "s").addToGroup(mod.group);
					inLink.changeFrom(con.key, "n");
					new Link(mod.key, con.key, "e", "s").addToGroup(this.group);
					var newLink = new Link(mod.key, con.key, "w", "s").addToGroup(this.group);

					/*
					token.dataStack.pop();
					token.dataStack.push(CompData.PROMPT);
					token.rewrite = true;
					return newLink;
					*/
				}

				token.dataStack.pop();
				token.dataStack.push(CompData.R);
				return nextLink;
			}

			else if (nextLink.to == this.key) {
				if (token.dataStack.last() == CompData.M) {

					var nextNode = this.graph.findNodeByKey(nextLink.from);
					if (!(nextNode instanceof Mod)) {
						token.dataStack.pop();
						var mod = new Mod().addToGroup(this.group);
						this.findLinksInto(null)[0].changeTo(mod.key, "s");
						new Link(mod.key, this.key, "e", "s").addToGroup(this.group);

						var newApp = this.copy().addToGroup(this.group);
						var newLink = new Link(mod.key, newApp.key, "w", "s").addToGroup(this.group);
						var newDer = new Der().addToGroup(this.group);
						new Link(newApp.key, newDer.key, "w", "s").addToGroup(this.group);

						
						var rightLink = this.findLinksOutOf("e")[0];
						var rightNode = this.graph.findNodeByKey(rightLink.to);

						var con = new Contract(rightNode.name).addToGroup(this.group);
						new Link(newApp.key, con.key, "e", "s").addToGroup(this.group);
						rightLink.changeFrom(con.key, "n");
						new Link(this.key, con.key, "e", "s").addToGroup(this.group);

						var leftDer = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);

						var con2 = new Contract(leftDer.name).addToGroup(this.group);
						leftDer.findLinksOutOf(null)[0].changeFrom(con2.key, "n");
						new Link(leftDer.key, con2.key, "n", "s").addToGroup(this.group);
						new Link(newDer.key, con2.key, "n", "s").addToGroup(this.group);

						token.modStack.push(mod.key);
						token.forward = true;
						token.rewrite = true;
						return newLink;
					}
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

	copy() {
		return new App();
	}
}