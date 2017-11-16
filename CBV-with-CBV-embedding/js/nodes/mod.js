var ModType = {
	M: 'M',
	MD: "Mᵈ",
	MP: "Mᵖ",
	I: 'I',
	ID: "Iᵈ",
	IP: "Iᵖ",
	//U: 'U',
}

class Mod extends Node {
	
	constructor() {
		super(null, "M");
		this.type = ModType.M;
	}

	transition(token, link) {
		if (link.to == this.key) {
			var data = token.dataStack.last();

			if (this.type.substring(0,1) == 'M' && data[0] == CompData.DELTA) {
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
			if (token.machine.evaluating) {
				token.rewriteFlag = RewriteFlag.F_UPDATE;
				token.machine.readyEvalTokens++;
			}
			
			return this.findLinksInto(null)[0];
		}
	}

	update(data) {
		var leftLink = this.findLinksOutOf("w")[0];

		if ((Number.isInteger(data) || typeof(data) === "boolean")) {
			var value = this.graph.findNodeByKey(leftLink.to);
			var oldData = value.name;
			value.text = data;
			value.name = data;
			return oldData;
		}
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_MODIFY && nextLink.from == this.key) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			var data = token.dataStack.pop();
			token.dataStack.push(CompData.UNIT);
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

			this.changeType(ModType.MD);
			if (token.machine.dNodes.indexOf(this.key) == -1)
				token.machine.dNodes.push(this.key);

			token.forward = false;
			token.rewrite = true;
			return nextLink;
		}

		else if (token.rewriteFlag == RewriteFlag.F_UPDATE && nextLink.to == this.key) {
			if (token.machine.evaluating) {
				token.rewrite = true;
				return nextLink;
			}

			else if (token.machine.updating) {
				var oldData = this.update(token.dataStack.last());
				if (this.type == ModType.MD || this.type == ModType.ID)
					token.machine.dNodes.splice(token.machine.dNodes.indexOf(this),1);
				this.changeType(this.type.substring(0,1));

				if (oldData != token.dataStack.last()) {
					this.changeType(this.type.substring(0,1)+'ᵖ');
					token.machine.pNodes.push(this.key);
				}
				token.delete();
				return null;
			}
		}

		else if (token.rewriteFlag == RewriteFlag.EMPTY) {
			token.rewrite = false;
			return nextLink;
		}
	}

	propagate(token) {
		if (token.machine.dNodes.indexOf(this.key) == -1) {
			this.changeType(this.type.substring(0,1)+'ᵈ');
			token.machine.dNodes.push(this.key);
		}
		token.delete();
		return null;
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

	copy() {
		var mod = new Inter();
		mod.changeType(this.type);
		return mod;
	}
}