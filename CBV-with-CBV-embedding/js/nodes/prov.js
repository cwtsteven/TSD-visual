class Prov extends Expo {

	constructor() {
		super("diamond", "");
	}

	transition(token, link) {
		if (link.to == this.key) {
			return this.findLinksOutOf(null)[0];
		}
		else if (link.from == this.key) {
			return this.findLinksInto(null)[0];
		}

	}

	copy() {
		return new Prov();
	}

}