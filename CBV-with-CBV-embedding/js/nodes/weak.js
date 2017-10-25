class Weak extends Expo {

	constructor() {
		super(null, 'C0');
	}

	analyse(token) {
		token.machine.aTokens.splice(token.machine.aTokens.indexOf(token), 1);	
		return null;
	}

	propagate(token) {
		token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
		return null;
	}

	copy() {
		return new Weak();
	}
	
}