define(function(require) {

	var Expo = require('nodes/expo');

	class Weak extends Expo {

		constructor() {
			super(null, 'C0');
		}

		copy() {
			return new Weak();
		}
		
	}

	return Weak;
});