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
			token.rewrite = false;

			if (nextLink.from == this.key && nextLink.fromPort == "w") {
				var data = token.dataStack.last();
				var rightLink = this.findLinksOutOf("e")[0];
				var prev = this.graph.findNodeByKey(rightLink.to);
				if (prev instanceof Mod || prev instanceof Contract) {

				}
				else if (prev instanceof Prov) {
					var prev2 = this.graph.findNodeByKey(prev.findLinksOutOf(null)[0].to);
					var newLink = this.createMod(data, prev2);
					prev.deleteAndPreserveInLink();
					token.rewrite = true;
				}
				else if (!(prev instanceof Promo)) {
					var newLink = this.createMod(data, prev);
					token.rewrite = true;
				}

				token.dataStack.pop();
				token.dataStack.push(CompData.R);
				return nextLink;
			}

			else if (nextLink.to == this.key) {
				if (token.dataStack.last() == CompData.M) {
					token.dataStack.pop();
					var key = token.dataStack.pop();

					var mod = new Mod().addToGroup(this.group);
					this.findLinksInto(null)[0].changeTo(mod.key, "s");
					new Link(mod.key, this.key, "e", "s").addToGroup(this.group);

					var newApp = this.copy().addToGroup(this.group);
					var newLink = new Link(mod.key, newApp.key, "w", "s").addToGroup(this.group);
					var newDer = new Der().addToGroup(this.group);
					new Link(newApp.key, newDer.key, "w", "s").addToGroup(this.group);

					var rightNode = this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to);
					var wrapper;
					if (rightNode instanceof Promo) {
						wrapper = rightNode.group.copy().addToGroup(this.group);
						Term.joinAuxs(rightNode.group.auxs, wrapper.auxs, this.group);
					}
					else if (rightNode instanceof Mod) {
						var promo = this.graph.findNodeByKey(rightNode.findLinksOutOf("w")[0].to);
						wrapper = promo.group.copy().addToGroup(this.group);
						Term.joinAuxs(promo.group.auxs, wrapper.auxs, this.group);
					}
					new Link(newApp.key, wrapper.prin.key, "e", "s").addToGroup(this.group);

					var leftDer = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);
					var leftMod = this.graph.findNodeByKey(leftDer.findLinksOutOf(null)[0].to);
					var leftPromo = this.graph.findNodeByKey(key);

					var fun = leftPromo.group.copy().addToGroup(this.group);
					Term.joinAuxs(leftPromo.group.auxs, fun.auxs, this.group);
					new Link(newDer.key, fun.prin.key, "n", "s").addToGroup(this.group);

					token.modStack.push(mod.key);
					token.forward = true;
					token.rewrite = true;
					return newLink;
				}
			}
		}

		token.rewrite = false;
		return nextLink;
	}

	createMod(data, prev) {
		if (data == CompData.LAMBDA) {
			var wrapper = prev.group.copy().addToGroup(prev.group.group);
			var mod = new Mod().addToGroup(this.group);
			new Link(mod.key, wrapper.prin.key, "w", "s").addToGroup(mod.group);

			var inLink = prev.findLinksInto(null)[0];
			new Link(inLink.from, mod.key, inLink.fromPort, "s").addToGroup(wrapper.group);
			inLink.changeFrom(mod.key, "e");
			Term.joinAuxs(prev.group.auxs, wrapper.auxs, wrapper.group);
		}
		else if ((Number.isInteger(data) || typeof(data) === "boolean")) {
			var mod = new Mod().addToGroup(this.group);
			var wrapper = BoxWrapper.create().addToGroup(mod.group);
			var con = new Const(data).addToGroup(wrapper.box);
			new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
			new Link(mod.key, wrapper.prin.key, "w", "s").addToGroup(this.group);
			var inLink = prev.findLinksInto(null)[0];
			new Link(inLink.from, mod.key, inLink.fromPort, "s").addToGroup(mod.group);
			inLink.changeFrom(mod.key, "e");
		}
	}

	copy() {
		return new App();
	}
}