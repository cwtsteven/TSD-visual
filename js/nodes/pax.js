class Pax extends Expo {

	constructor(name) {
		super(null, "?", name);
	}

	copy() {
		return new Pax(this.name);
	}
}