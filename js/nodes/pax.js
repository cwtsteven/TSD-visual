class Aux extends Expo {
	
}

class Pax extends Aux {

	constructor(name) {
		super(null, "?", name);
	}

	copy() {
		return new Pax(this.name);
	}
}