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
			else if (data == CompData.PROMPT) {
				token.rewriteFlag = RewriteFlag.F_MPROMO;
				return this.findLinksOutOf("w")[0];
			}
			else if (data == CompData.R) {
				if (token.modStack.last() != ModData.NOCOPY) {
					token.rewriteFlag = RewriteFlag.F_MPROMO;
					return this.findLinksOutOf("w")[0];
				}
				token.dataStack.pop();
				token.dataStack.push(CompData.M);
				token.forward = false;
				return link;
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
		if (token.rewriteFlag == RewriteFlag.F_MPROMO && nextLink.from == this.key) {
			token.rewriteFlag = RewriteFlag.EMPTY;
			var prev = this.graph.findNodeByKey(this.findLinksInto(null)[0].from);

			if (token.modStack.last() != ModData.NOCOPY) {
				if (prev instanceof Der) { 
					var righLink = this.findLinksOutOf("e")[0];
					var weak = new Weak(this.graph.findNodeByKey(righLink.to).name).addToGroup(this.group);
					righLink.changeFrom(weak.key, "n");

					var inLink = this.findLinksInto(null)[0];
					nextLink.changeFrom(inLink.from, inLink.fromPort);
					this.delete();
				}
				else if (prev instanceof Contract && token.boxStack.length >= 1) {
					var link = token.boxStack.last();
					var inLinks = prev.findLinksInto(null);
					if (inLinks.length == 1) { 
						// this will not happen as the C-node should have taken care of it
					}
					else {
						var leftNode = this.graph.findNodeByKey(nextLink.to);
						var con = new Contract(leftNode.name).addToGroup(this.group);
						link.changeTo(con.key, "s");
						var newLink = new Link(con.key, nextLink.to, "n", nextLink.toPort).addToGroup(this.group);
						nextLink.changeTo(con.key, "s");
					}
					token.rewriteFlag = RewriteFlag.F_C;
					token.rewrite = true;
					return newLink;
				}
			}

			token.rewrite = true;
			return nextLink;			
		}

		else if (token.rewriteFlag == RewriteFlag.F_MODIFY && nextLink.from == this.key) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			var link = token.dataStack.pop();
			var toNode = this.graph.findNodeByKey(link.to);
			var delta = this.graph.findNodeByKey(link.from);
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
		if (token.evalToken.link == null) {
			if (token.link.fromPort == "e") {
				if (token.mNodes.indexOf(this.key) != -1) {
					this.changeType(ModType.R);
					token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
					token.machine.rNodes.push(this.key);
					return null;
				}
				else {
					this.changeType(ModType.M);
					token.mNodes.push(this.key);
					token.machine.rNodes.splice(token.machine.rNodes.indexOf(this.key), 1);
				}

				token.evaluating = true;
				token.evalToken.forward = true;
				token.evalToken.setLink(token.link);
				return token.link;
			}
			else if (token.link.fromPort == "w") {
				token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
				return null;
			}
		}
		else if (token.link.fromPort == "e" && token.evalToken.link == token.link && token.evalToken.forward == token.forward && token.evalToken.rewriteFlag == RewriteFlag.EMPTY) {
			token.evaluating = false;
			var leftLink = this.findLinksOutOf("w")[0];
			var weak = new Weak(this.graph.findNodeByKey(leftLink.to).name).addToGroup(this.group);
			leftLink.changeFrom(weak.key, "n");

			if (token.evalToken.dataStack.last() == CompData.LAMBDA) {
				var rightNode = this.graph.findNodeByKey(token.link.to);
				var target;
				var link;
				if (rightNode instanceof If1) {
					link = rightNode.findLinksOutOf("n")[0];
					target = this.graph.findNodeByKey(link.to);
				}
				else if (rightNode instanceof If2) {
					link = rightNode.findLinksOutOf("e")[0];
					target = this.graph.findNodeByKey(link.to);
				}
				else {
					target = rightNode;
					link = token.link;
				}
				var contract = new Contract(target.name).addToGroup(this.group);
				var newLink = new Link(this.key, contract.key, "w", "s").addToGroup(this.group);
				new Link(link.from, contract.key, "e", "s").addToGroup(this.group);
				link.changeFrom(contract.key, "n");

				token.evalToken.reset();
				token.evaluating = false;
				return this.findLinksInto(null)[0];
			}
			else if (token.evalToken.dataStack.last() == CompData.M) {
				var app = this.graph.findNodeByKey(token.link.to);
				var newApp = app.copy().addToGroup(this.group);
				var newLink = new Link(this.key, newApp.key, "w", "s").addToGroup(this.group);
				var newDer = new Der().addToGroup(this.group);
				new Link(newApp.key, newDer.key, "w", "s").addToGroup(this.group);

				var con = new Contract(app.name).addToGroup(this.group);
				new Link(newApp.key, con.key, "e", "s").addToGroup(this.group);
				app.findLinksOutOf("e")[0].changeFrom(con.key, "n");
				new Link(app.key, con.key, "e", "s").addToGroup(this.group);

				var leftDer = this.graph.findNodeByKey(app.findLinksOutOf("w")[0].to);

				var con2 = new Contract(leftDer.name).addToGroup(this.group);
				leftDer.findLinksOutOf(null)[0].changeFrom(con2.key, "n");
				new Link(leftDer.key, con2.key, "n", "s").addToGroup(this.group);
				new Link(newDer.key, con2.key, "n", "s").addToGroup(this.group);

				token.evaluating = true;
				token.forward = false;
				token.evalToken.reset();
				token.evalToken.forward = true;
				token.evalToken.setLink(newLink);
				token.evalToken.modStack.push(this.key);
				return newLink;
			}
			else {
				var data = token.evalToken.dataStack.last();
				var wrapper = BoxWrapper.create().addToGroup(this.group);
				var cons = new Const(data).addToGroup(wrapper.box);
				new Link(wrapper.prin.key, cons.key, "n", "s").addToGroup(wrapper);
				new Link(this.key, wrapper.prin.key, "w", "s").addToGroup(this.group);
				token.evalToken.reset();
				token.evaluating = false;
				return this.findLinksInto(null)[0];
			}
		}
		else if (token.link.fromPort == "w" && token.evalToken.link == token.link && token.evalToken.forward == token.forward && token.evalToken.rewriteFlag == RewriteFlag.EMPTY) {
			token.evaluating = false;
			token.evalToken.reset();
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