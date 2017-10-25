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
				if (prev instanceof Prov) {
					prev.deleteAndPreserveInLink();
					prev = this.graph.findNodeByKey(rightLink.to);
					if ((Number.isInteger(data) || typeof(data) === "boolean")) {
						var right = prev;

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
						var right = prev;
						var promo = this.searchForPromo(right);
						var promoCopy = promo.group.copy().addToGroup(this.group);
						Term.joinAuxs(promo.group.auxs, promoCopy.auxs, this.group);
						promoCopy.deepCopy();

						var mod = new Mod().addToGroup(this.group);
						//var con = new Contract(promo.name).addToGroup(this.group);
						new Link(this.key, mod.key, "e", "s").addToGroup(mod.group);
						//promo.findLinksInto(null)[0].changeTo(con.key, "s");
						this.findLinksOutOf('e')[0].changeFrom(mod.key, "e");
						new Link(mod.key, promoCopy.prin.key, "w", "s").addToGroup(this.group);
						//new Link(con.key, promo.key, "n", "s").addToGroup(this.group);
					}
				}
				else if (prev instanceof Promo || prev instanceof Mod || prev instanceof Inter || prev instanceof Contract) {

				}
				else if ((Number.isInteger(data) || typeof(data) === "boolean")) {
					var right = prev;

					var mod = new Inter().addToGroup(this.group);
					var wrapper = BoxWrapper.create().addToGroup(mod.group);
					var con = new Const(data).addToGroup(wrapper.box);
					new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
					new Link(mod.key, wrapper.prin.key, "w", "s").addToGroup(this.group);
					var inLink = right.findLinksInto(null)[0];
					new Link(inLink.from, mod.key, inLink.fromPort, "s").addToGroup(mod.group);
					inLink.changeFrom(mod.key, "e");
					token.rewrite = true;
				}
				/*
				else if (data == CompData.LAMBDA) {
					var right = prev;
					var promo = this.searchForPromo(right);
					promo.group.deepCopy();

					var mod = new Inter().addToGroup(this.group);
					var con = new Contract(promo.name).addToGroup(this.group);
					new Link(this.key, mod.key, "e", "s").addToGroup(mod.group);
					promo.findLinksInto(null)[0].changeTo(con.key, "s");
					this.findLinksOutOf('e')[0].changeFrom(mod.key, "e");
					new Link(mod.key, con.key, "w", "s").addToGroup(this.group);
					new Link(con.key, promo.key, "n", "s").addToGroup(this.group);
				}
				*/

				token.dataStack.pop();
				token.dataStack.push(CompData.R);
				return nextLink;
			}

			else if (nextLink.to == this.key) {
				if (token.dataStack.last() == CompData.I) {

					var nextNode = this.graph.findNodeByKey(nextLink.from);
					if (!(nextNode instanceof Inter && nextLink.fromPort == "e")) {
						token.dataStack.pop();
						//token.copyStack.push(CopyData.U);
						var leftDer = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);
						var leftPromo = this.searchForPromo(this.graph.findNodeByKey(leftDer.findLinksOutOf(null)[0].to));
						leftPromo.group.deepCopy();
						var rightPromo = this.searchForPromo(this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to));
						rightPromo.group.deepCopy();

						var mod = new Inter().addToGroup(this.group);
						mod.changeType(ModType.U);
						this.findLinksInto(null)[0].changeTo(mod.key, "s");
						new Link(mod.key, this.key, "e", "s").addToGroup(this.group);

						var newApp = this.copy().addToGroup(this.group);
						var newLink = new Link(mod.key, newApp.key, "w", "s").addToGroup(this.group);
						var newDer = new Der().addToGroup(this.group);
						new Link(newApp.key, newDer.key, "w", "s").addToGroup(this.group);

						var con = new Contract(rightPromo.name).addToGroup(this.group);
						var r_Link = rightPromo.findLinksInto(null)[0];
						r_Link.changeTo(con.key, "s");
						new Link(con.key, rightPromo.key, "n", "s").addToGroup(this.group);
						new Link(newApp.key, con.key, "e", "s").addToGroup(this.group);

						var con2 = new Contract(leftPromo.name).addToGroup(this.group);
						var l_Link = leftPromo.findLinksInto(null)[0];
						l_Link.changeTo(con2.key, "s");
						new Link(con2.key, leftPromo.key, "n", "s").addToGroup(this.group);
						new Link(newDer.key, con2.key, "n", "s").addToGroup(this.group);

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