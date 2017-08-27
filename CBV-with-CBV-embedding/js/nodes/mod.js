var ModType = {
	M: 'M',
	R: 'R',
}

class Mod extends Node {
	
	constructor() {
		super(null, "M");
		this.type = ModType.M;
	}

	transition(token, link) {
		if (link.to == this.key) {
			var data = token.dataStack.last();

			if (data == CompData.DELTA) {
				token.dataStack.pop();
				token.rewriteFlag = RewriteFlag.F_MODIFY;
				return this.findLinksOutOf("e")[0];
			}
			else {
				return this.findLinksOutOf("w")[0];
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
		if (token.rewriteFlag == RewriteFlag.F_MODIFY && nextLink.from == this.key) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			var key = token.dataStack.pop();
			var delta = this.graph.findNodeByKey(key);
			var link = delta.findLinksOutOf("e")[0];
			var toNode = this.graph.findNodeByKey(link.to);
			var weak = new Weak().addToGroup(this.group);
			new Link(weak.key, nextLink.to, "n", "s").addToGroup(this.group);
			var con = new Contract(toNode.name).addToGroup(this.group);
			nextLink.changeTo(con.key, "s");
			new Link(delta.key, con.key, link.fromPort, "s").addToGroup(this.group);
			link.changeFrom(con.key, "n");

			this.changeType(ModType.R);
			if (token.machine.rNodes.indexOf(this.key) == -1)
				token.machine.rNodes.push(this.key);

			token.forward = false;
			token.rewrite = true;
			return nextLink;
		}

		else if (token.rewriteFlag == RewriteFlag.EMPTY) {
			token.rewrite = false;
			return nextLink;
		}
	}

	analyse(token) {
		if (token.node == this.key) {
			token.machine.analysisToken.splice(token.machine.analysisToken.indexOf(token), 1);
			return null;
		}
		else if (token.link.fromPort == "e") {
			if (this.type == ModType.R)
				token.machine.rNodes.splice(token.machine.rNodes.indexOf(this.key), 1);
			this.changeType(ModType.M);
			return super.analyse(token);
		}
		else if (token.link.fromPort == "w") {
			token.machine.analysisToken.splice(token.machine.analysisToken.indexOf(token), 1);
			return null;
		}
	}

	propagate(token) {
		var evalToken = token.evalToken;
		if (!token.evaluating) {
			if (token.link.fromPort == "e") {
				if (token.mNodes.indexOf(this.key) != -1) {
					this.changeType(ModType.R);
					token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
					token.machine.rNodes.push(this.key);
					return null;
				}
				else {
					this.changeType(ModType.M);
					token.machine.rNodes.splice(token.machine.rNodes.indexOf(this.key), 1);
				}

				token.evaluating = true;
				evalToken.forward = true;
				evalToken.setLink(token.link);
				return token.link;
			}
			else if (token.link.fromPort == "w") {
				token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
				return null;
			}
		}
		else if (token.link.fromPort == "e" && evalToken.link == token.link && evalToken.forward == token.forward && evalToken.rewriteFlag == RewriteFlag.EMPTY) {
			token.evaluating = false;
			token.mNodes.push(this.key);
			var leftLink = this.findLinksOutOf("w")[0];
			var weak = new Weak(this.graph.findNodeByKey(leftLink.to).name).addToGroup(this.group);
			leftLink.changeFrom(weak.key, "n");

			if (evalToken.dataStack.last() == CompData.LAMBDA) {
				var rightNode = this.graph.findNodeByKey(token.link.to);
				var contract = new Contract(rightNode.name).addToGroup(this.group);
				var newLink = new Link(this.key, contract.key, "w", "s").addToGroup(this.group);
				new Link(token.link.from, contract.key, "e", "s").addToGroup(this.group);
				token.link.changeFrom(contract.key, "n");

				evalToken.reset();
				token.evaluating = false;
				return this.findLinksInto(null)[0];
			}
			else if (evalToken.dataStack.last() == CompData.M) {
				evalToken.dataStack.pop();
				var key = evalToken.dataStack.pop();
				var promo = this.graph.findNodeByKey(key);

				var app = this.graph.findNodeByKey(token.link.to);
				var newApp = app.copy().addToGroup(this.group);
				var newLink = new Link(this.key, newApp.key, "w", "s").addToGroup(this.group);
				var newDer = new Der().addToGroup(this.group);
				new Link(newApp.key, newDer.key, "w", "s").addToGroup(this.group);

				var con = new Contract(app.name).addToGroup(this.group);
				new Link(newApp.key, con.key, "e", "s").addToGroup(this.group);
				var appRightLink = app.findLinksOutOf("e")[0];
				appRightLink.changeFrom(con.key, "n");
				new Link(app.key, con.key, "e", "s").addToGroup(this.group);

				var con2 = new Contract(promo.name).addToGroup(this.group);
				var promoInLink = promo.findLinksInto(null)[0];
				promoInLink.changeTo(con2.key, "s");
				new Link(con2.key, key, "n", "s").addToGroup(this.group);
				new Link(newDer.key, con2.key, "n", "s").addToGroup(this.group);

				token.evaluating = true;
				token.forward = false;
				evalToken.reset();
				evalToken.forward = true;
				evalToken.setLink(newLink);
				evalToken.modStack.push(this.key);
				return newLink;
			}
			else {
				var data = evalToken.dataStack.last();
				var wrapper = BoxWrapper.create().addToGroup(this.group);
				var cons = new Const(data).addToGroup(wrapper.box);
				new Link(wrapper.prin.key, cons.key, "n", "s").addToGroup(wrapper);
				new Link(this.key, wrapper.prin.key, "w", "s").addToGroup(this.group);
				evalToken.reset();
				token.evaluating = false;
				return this.findLinksInto(null)[0];
			}
		}
		else if (token.link.fromPort == "w" && evalToken.link == token.link && evalToken.forward == token.forward && evalToken.rewriteFlag == RewriteFlag.EMPTY) {
			token.evaluating = false;
			evalToken.reset();
			return this.findLinksInto(null)[0];
		}
		else {
			token.setLink(this.findLinksOutOf(token.link.fromPort)[0]);
			return token.link;
		}
	}

	changeType(type) {
		this.type = type;
		this.text = type;
	}

	copy() {
		return new Mod();
	}

}