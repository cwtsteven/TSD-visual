class UnOp extends Node {

	constructor(text) {
		super(null, text);
		this.subType = null;
	}

	transition(token, link) {
		if (link.to == this.key) {
			token.dataStack.push(CompData.PROMPT);
			return this.findLinksOutOf(null)[0];
		}
		else if (link.from == this.key) {
			if (token.dataStack[token.dataStack.length-2] == CompData.PROMPT) {
				var v1 = token.dataStack.pop();
						 token.dataStack.pop();
				token.dataStack.push(this.unOpApply(this.subType, v1));
				token.rewriteFlag = RewriteFlag.F_OP;
				return this.findLinksInto(null)[0];
			}
		}
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_OP && nextLink.to == this.key) {
			token.rewriteFlag = RewriteFlag.EMPTY;
			
			var prev = this.graph.findNodeByKey(this.findLinksOutOf(null)[0].to);
			if (prev instanceof Promo) {
				var wrapper = BoxWrapper.create().addToGroup(this.group);
				var newConst = new Const(token.dataStack.last()).addToGroup(wrapper.box);
				new Link(wrapper.prin.key, newConst.key, "n", "s").addToGroup(wrapper);
				nextLink.changeTo(wrapper.prin.key, "s");
				prev.group.delete();
				this.delete();

				token.rewriteFlag = RewriteFlag.F_PROMO;
			}

			else {
				var prev = this.graph.findNodeByKey(this.findLinksInto(null)[0].from);
				if (prev instanceof Mod || prev instanceof BinOp || prev instanceof UnOp 
					|| prev instanceof If || prev instanceof If1 || prev instanceof If2 
					|| prev instanceof Prov || prev instanceof Delta) {

				}
				else {
					var data = token.dataStack.last();
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

	unOpApply(type, v1) {
		switch(type) {
			case UnOpType.Not: return !v1;
		}
	}

	copy() {
		var newNode = new UnOp(this.text);
		newNode.subType = this.subType;
		return newNode;
	}

}