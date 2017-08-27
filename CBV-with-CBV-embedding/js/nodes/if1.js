class If1 extends Node {
	constructor() {
		super(null, "if-1");
	}

	transition(token, link) {
		if (link.to == this.key) {
			return this.findLinksOutOf("n")[0];
		}
		else if (link.from == this.key && link.fromPort == "n") {
			return this.findLinksInto(null)[0];
		} 
	}

	analyse(token) {
		if (token.link.fromPort == "w") {
			if (this.otherPort && this.propPorts.indexOf("e") == -1) {
				this.propPorts.push("e");
				this.otherPort = false;
			}
			return super.analyse(token);
		}
		else if (token.link.fromPort == 'n')
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
		return new If1();
	}
}