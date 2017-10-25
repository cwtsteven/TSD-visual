var ModType = {
	M: 'M',
	R: 'R',
	I: 'I',
	U: 'U',
}

class Mod extends Node {
	
	constructor() {
		super(null, "M");
		this.type = ModType.M;
		this.numParents = 0;
		this.parents = [];
	}

	transition(token, link) {
		if (link.to == this.key) {
			var data = token.dataStack.last();

			if (data[0] == CompData.DELTA) {
				token.rewriteFlag = RewriteFlag.F_MODIFY;
				return this.findLinksOutOf("e")[0];
			}
			else {
				return this.findLinksOutOf("w")[0];
			}
		}
		else if (link.from == this.key && link.fromPort == "w") {
			return this.findLinksInto(null)[0];
		}
		else if (link.from == this.key && link.fromPort == "e") {
			return this.findLinksInto(null)[0];
		}
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_MODIFY && nextLink.from == this.key) {
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

			this.changeType(ModType.R);
			if (token.machine.rNodes.indexOf(this.key) == -1)
				token.machine.rNodes.push(this.key);

			this.parents = [];

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
		if (token.link.fromPort == "e") {
			this.parents = union_arrays(this.parents, token.mNodes);
			console.log(this.parents);
			if (token.mNodes.indexOf(this.key) == -1) {
				if (this.numParents == 0) {
					this.numParents++;
					if (this.type == ModType.R) {
						token.machine.aTokens.splice(token.machine.aTokens.indexOf(token), 1);		
						return null;
					}
					else {
						token.mNodes.push(this.key);
						return this.findLinksInto(null)[0];
					}
				}
				else {
					this.numParents++;
					token.machine.aTokens.splice(token.machine.aTokens.indexOf(token), 1);		
					return null;
				}
			}
			else {
				token.machine.aTokens.splice(token.machine.aTokens.indexOf(token), 1);		
				return null;
			}
		}
	}

	propagate(token) {
		var evalToken = token.evalToken;

		if (!token.evaluating) {
			if (token.link.fromPort == "e") {
				if (this.numParents > 1) {
					this.numParents--;
					token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
					return null;
				}

				else if (this.numParents == 1) {
					this.numParents--;
					token.evaluating = true;
					token.evalToken.reset();
					evalToken.setLink(token.link);
					return token.link;
				}

				else if (this.numParents == 0) {
					if (this.type == ModType.M)
						this.changeType(ModType.R);
					token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
					return null;
				}
			}
			else if (token.link.fromPort == "w") {
				token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
				return null;
			}
		}

		else if (token.link.fromPort == "e" && evalToken.link == token.link && evalToken.forward == token.forward && evalToken.rewriteFlag == RewriteFlag.EMPTY) {
			token.evaluating = false;
			var data = evalToken.dataStack.last();

			var leftLink = this.findLinksOutOf("w")[0];

			if ((Number.isInteger(data) || typeof(data) === "boolean")) {
				var wrapper = BoxWrapper.create().addToGroup(this.group);
				var con = new Const(data).addToGroup(wrapper.box);
				new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
				new Link(this.key, wrapper.prin.key, "w", "s").addToGroup(this.group);
				token.rewrite = true;
			}
			else if (data == CompData.LAMBDA) {
				var outNode = this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to);
				var newRight = outNode.deepUnfolding(this);
				
				new Link(this.key, newRight.prin.key, "w", "s").addToGroup(this.group);
				token.rewrite = true;
			}

			var weak = new Weak(this.graph.findNodeByKey(leftLink.to).name).addToGroup(this.group);
			leftLink.changeFrom(weak.key, "n");

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
		var mod = new Mod();
		mod.changeType(this.type);
		return mod;
	}
}

class Inter extends Mod {

	constructor() {
		super();
		this.changeType(ModType.I);
	}

	transition(token, link) {
		if (link.to == this.key) {
			return this.findLinksOutOf("w")[0];
		}
		else if (link.from == this.key && link.fromPort == "w") {
			if (this.type == ModType.U) {
				token.copyStack.pop();
				this.changeType(ModType.I);
				token.rewriteFlag = RewriteFlag.F_U;
			}
			return this.findLinksInto(null)[0];
		}
		else if (link.from == this.key && link.fromPort == "e") {
			return this.findLinksInto(null)[0];
		}
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_U) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			this.changeType(ModType.I);
			token.forward = false;
			token.rewrite = true;
			return nextLink;
		}

		else if (token.rewriteFlag == RewriteFlag.EMPTY) {
			token.rewrite = false;
			return nextLink;
		}
	}

	propagate(token) {
		var evalToken = token.evalToken;

		if (this.type == ModType.U && this.numParents == 1) {
			this.numParents--;
			token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
			return null;
		}

		if (token.link.fromPort == 'e' && evalToken.link == token.link && evalToken.forward == token.forward 
			&& evalToken.dataStack.last() == CompData.I && evalToken.rewriteFlag == RewriteFlag.EMPTY) {

			var leftLink = this.findLinksOutOf('w')[0];

			var app = this.graph.findNodeByKey(this.findLinksOutOf('e')[0].to);
			app.appDeepCopy(this);

			var weak = new Weak().addToGroup(this.group);
			leftLink.changeFrom(weak.key, "n");

			evalToken.reset();
			evalToken.setLink(this.findLinksOutOf("w")[0]);
			this.changeType(ModType.U);
			return token.link;
		}

		else if (token.link.fromPort == 'e' && evalToken.link == this.findLinksOutOf('w')[0] && evalToken.forward == token.forward 
			&& evalToken.rewriteFlag == RewriteFlag.EMPTY) {
			evalToken.reset();
			token.evaluating = false;
			this.changeType(ModType.I);
			return this.findLinksInto(null)[0];
		}

		else
			return super.propagate(token);
	}

	copy() {
		var mod = new Inter();
		mod.changeType(this.type);
		return mod;
	}
}