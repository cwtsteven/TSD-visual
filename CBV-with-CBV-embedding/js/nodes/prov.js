class Prov extends Node {
	
	constructor() {
		super('diamond', '');
		this.width = ".3";
		this.height = ".3";
	}

	transition(token, link) {
		if (link.to == this.key) {
			return this.findLinksOutOf(null)[0];
		}
		else if (link.from == this.key) {
			return this.findLinksInto(null)[0];
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