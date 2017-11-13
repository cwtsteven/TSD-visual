class Prov extends Node {
	
	constructor() {
		super('diamond', '');
		this.width = ".3";
		this.height = ".3";
	}

	transition(token, link) {
		if (link.to == this.key) {
			var data = token.dataStack.last();

			if (data[0] == CompData.DELTA) {
				token.rewriteFlag = RewriteFlag.F_MODIFY;
				return this.findLinksOutOf(null)[0];
			}

			else
				return this.findLinksOutOf(null)[0];
		}
		else if (link.from == this.key) {
			token.rewriteFlag = RewriteFlag.F_MOD;
			return this.findLinksInto(null)[0];
		}
	}

	rewrite(token, nextLink) {
		if (nextLink.to == this.key && token.rewriteFlag == RewriteFlag.F_MOD) {
			token.rewriteFlag = RewriteFlag.EMPTY;
			var data = token.dataStack.last();

			if ((Number.isInteger(data) || typeof(data) === "boolean")) {
				var mod = new Mod().addToGroup(this.group);
				var wrapper = BoxWrapper.create().addToGroup(mod.group);
				var con = new Const(data).addToGroup(wrapper.box);
				new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
				new Link(mod.key, wrapper.prin.key, "w", "s").addToGroup(this.group);
				var outLink = this.findLinksOutOf(null)[0];
				outLink.changeFrom(mod.key, "e");
				var inLink = this.findLinksInto(null)[0];
				inLink.changeTo(mod.key, "s");
				this.delete();
				token.rewrite = true;
			}
			/*
			else if (data == CompData.LAMBDA) {
				var mod = new Mod().addToGroup(this.group);
				var outLink = this.findLinksOutOf(null)[0];
				outLink.changeFrom(mod.key, "e");
				var inLink = this.findLinksInto(null)[0];
				inLink.changeTo(mod.key, "s");
				this.delete();

				var newLeft = mod.graph.findNodeByKey(mod.findLinksOutOf("e")[0].to).deepUnfolding(mod);
				new Link(mod.key, newLeft.key, "w", "s").addToGroup(this.group);

				token.rewrite = true;
			}
			*/

			return nextLink;
		}

		else if (nextLink.from == this.key && token.rewriteFlag == RewriteFlag.F_MODIFY) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			var data = token.dataStack.pop();
			var key = data.substring(2,data.length - 1);
			var delta = this.graph.findNodeByKey(key);
			var link = delta.findLinksOutOf("e")[0];
			var toNode = this.graph.findNodeByKey(link.to);
			var weak = new Weak().addToGroup(this.group);
			new Link(weak.key, nextLink.to, "n", "s").addToGroup(this.group);
			var con = new Contract(toNode.name).addToGroup(this.group);
			nextLink.changeTo(con.key, "s");
			new Link(delta.key, con.key, link.fromPort, "s").addToGroup(this.group);
			link.changeFrom(con.key, "n");

			token.dataStack.push(CompData.PROMPT);
			token.rewrite = true;
			return nextLink;
		}

		else if (token.rewriteFlag == RewriteFlag.EMPTY) {
			token.rewrite = false;
			return nextLink;
		}
	}

	deleteAndPreserveInLink() { 
		var inLink = this.findLinksInto(null)[0];
		var outLink = this.findLinksOutOf(null)[0];
		if (outLink != null && inLink != null) {
			inLink.changeTo(outLink.to, outLink.toPort);
		}
		super.delete();
	}

	copy() {
		return new Prov();
	}

}