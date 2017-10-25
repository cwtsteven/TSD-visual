class If2 extends Node {
	constructor() {
		super(null, "if-2");
	}

	transition(token, link) {
		if (link.to == this.key) {
			return this.findLinksOutOf("e")[0];
		}
		else if (link.from == this.key && link.fromPort == "e") {
			return this.findLinksInto(null)[0];
		} 
	}

	analyse(token) {
		if (token.link.fromPort == "w") {
			var newIf = new If().addToGroup(this.group);
			for (let link of this.findLinksOutOf(null)) {
				link.changeFrom(newIf.key, link.fromPort);
			}
			this.findLinksInto(null)[0].changeTo(newIf.key, "s");
			this.delete();
			return token.link;
		}

		else if (token.link.fromPort == "n") {
			this.halt = true;	
			return token.link;
		}

		else if (token.link.fromPort == "e") {
			return this.findLinksInto(null)[0];
		}
	}

	copy() {
		return new If2();
	}
}