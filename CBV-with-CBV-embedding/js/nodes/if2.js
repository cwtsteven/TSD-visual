class If2 extends Node {
	constructor() {
		super(null, "if-2");
	}

	transition(token, link) {
		if (link.to == this.key) {
			token.dataStack.push(CompData.PROMPT);
			return this.findLinksOutOf("e")[0];
		}
		else if (link.from == this.key && link.fromPort == "e") {
			token.rewriteFlag = RewriteFlag.F_MOD;
			return this.findLinksInto(null)[0];
		} 
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_MOD && nextLink.to == this.key) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			var nextNode = this.graph.findNodeByKey(nextLink.from);
			var newLink = nextLink;
			if (!(nextNode instanceof Mod)) {
				var data = token.dataStack.pop();
				if (data == CompData.LAMBDA) {
					var outLink = this.findLinksOutOf("e")[0];
					var node = this.graph.findNodeByKey(outLink.to);
					var mod = new Mod().addToGroup(this.group);
					var con = new Contract().addToGroup(this.group);
					outLink.changeFrom(con.key, "n");
					new Link(mod.key, con.key, "w", "s").addToGroup(this.group);
					new Link(this.key, con.key, "e", "s").addToGroup(this.group);
					newLink = new Link(nextLink.from, mod.key, nextLink.fromPort, "s").addToGroup(this.group);
					nextLink.changeFrom(mod.key, "e");
				}
			}

			var op = token.dataStack.pop();
			if (op == CompData.PROMPT)
				token.dataStack.push(data);
			else if (op == CompData.R)
				token.dataStack.push(CompData.M);
			
			token.rewrite = true;
			return newLink;
		}

		else if (token.rewriteFlag == RewriteFlag.EMPTY) {
			token.rewrite = false;
			return nextLink;
		}
	}

	analyse(token) {
		if (token.link.fromPort == "w") {
			if (this.otherPort && this.propPorts.indexOf("n") == -1) {
				this.propPorts.push("n");
				this.otherPort = false;
			}
			return super.analyse(token);
		}
		else if (token.link.fromPort == 'e')
			return super.analyse(token);
		else {
			if (this.propPorts.indexOf("w") == -1) {
				this.otherPort = true;
				token.machine.analysisToken.splice(token.machine.analysisToken.indexOf(token), 1);
				return null;
			}
			else {
				var link = super.analyse(token);
				if (this.propPorts.length == 0)
					this.otherPort = false;
				return link;
			}
		}
	}

	propagate(token) {
		if (token.link.fromPort == "w") {
			var newIf = new If().addToGroup(this.group);
			newIf.propPorts = Array.from(this.propPorts);
			for (let link of this.findLinksOutOf(null)) {
				link.changeFrom(newIf.key, link.fromPort);
			}
			this.findLinksInto(null)[0].changeTo(newIf.key, "s");
			this.delete();
			return token.link;
		}
		else
			return super.propagate(token);
	}

	copy() {
		return new If2();
	}
}