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
			token.dataStack.pop();
			token.dataStack.push(CompData.R);
			token.forward = true;
			return this.findLinksOutOf("w")[0];
		}
		else if (link.from == this.key && link.fromPort == "w") {
			if (token.dataStack.last() == CompData.R) {	
				token.dataStack.pop();
				token.dataStack.push(CompData.I);
			}
			else if (token.dataStack.last() == CompData.I) {
				token.dataStack.pop();
				token.dataStack.pop();
				token.dataStack.push(CompData.I);
			}
			token.rewriteFlag = RewriteFlag.F_INTER;
			return this.findLinksInto(null)[0];
		}
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_INTER) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			if (nextLink.to == this.key) {

				token.rewriteFlag = RewriteFlag.EMPTY;

				var nextNode = this.graph.findNodeByKey(nextLink.from);
				
				if (nextNode instanceof Mod || nextNode instanceof Der) { // || nextNode instanceof Prov) {

				}

				else {
					token.dataStack.pop();

					var mod = new Inter().addToGroup(this.group);
					mod.changeType(ModType.U);
					this.findLinksInto(null)[0].changeTo(mod.key, "s");
					new Link(mod.key, this.key, "e", "s").addToGroup(this.group);

					this.appDeepCopy(mod);
					token.copyStack.push(CopyData.U);

					token.forward = true;
					token.rewrite = true;
					return mod.findLinksOutOf("w")[0];
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

	appDeepCopy(mod) {
		var next = this;
		var prev = mod;
		var prevPort = "w";
		while (next instanceof App || next instanceof Der) {
			if (next instanceof App) {
				var newApp = this.copy().addToGroup(this.group);
				new Link(prev.key, newApp.key, prevPort, "s").addToGroup(this.group);
				var newRight = this.graph.findNodeByKey(next.findLinksOutOf("e")[0].to).deepUnfolding(mod);
				new Link(newApp.key, newRight.prin.key, "e", "s").addToGroup(this.group);
				next = this.graph.findNodeByKey(next.findLinksOutOf("w")[0].to);
				prev = newApp;
				prevPort = "w";
			}
			else {
				var newDer = new Der().addToGroup(this.group);
				new Link(prev.key, newDer.key, prevPort, "s").addToGroup(this.group);
				next = this.graph.findNodeByKey(next.findLinksOutOf(null)[0].to);
				prev = newDer;
				prevPort = "n";
			}
		}
		var newLeft = this.graph.findNodeByKey(next.findLinksOutOf(null)[0].to).deepUnfolding(mod);
		new Link(prev.key, newLeft.prin.key, prevPort, "s").addToGroup(this.group);
	}

	copy() {
		return new App();
	}
}