class If2 extends Node {
	constructor() {
		super(null, "if-2");
	}

	transition(token, link) {
		if (link.to == this.key) {
			return this.findLinksOutOf("e")[0];
		}
		else if (link.from == this.key && link.fromPort == "e") {
			//token.rewriteFlag = RewriteFlag.F_INTER;
			return this.findLinksInto(null)[0];
		} 
	}
/*
	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_INTER) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			var prev = this.graph.findNodeByKey(this.findLinksInto(null)[0].from);
			if (prev instanceof Mod || prev instanceof BinOp || prev instanceof UnOp 
				|| prev instanceof If || prev instanceof If1 || prev instanceof If2 
				|| prev instanceof Prov || prev instanceof Delta || prev instanceof Contract) {

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
			}
			
			token.rewrite = true;
			return nextLink;
		}
		
		else if (token.rewriteFlag == RewriteFlag.EMPTY) {
			token.rewrite = false;
			return nextLink;
		}
	}
*/

	copy() {
		return new If2();
	}
}