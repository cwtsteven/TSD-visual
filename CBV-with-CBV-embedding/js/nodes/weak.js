class Weak extends Expo {

	constructor() {
		super(null, 'C0');
	}

	propagate(token) {
		token.delete();
		return null;
	}

	copy() {
		return new Weak();
	}
	
}