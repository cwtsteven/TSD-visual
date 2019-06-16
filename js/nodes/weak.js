define(function(require) {

	var Expo = require('nodes/expo');

	class Weak extends Expo {

		constructor() {
			super(null, 'C');
		}

		copy() {
			return new Weak();
		}
		
	}

	return Weak;
});