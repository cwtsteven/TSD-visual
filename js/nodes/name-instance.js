define(function(require) {

	var Node = require('node');

	class NameInstance extends Node {

		constructor(pname) {
			super(null, "", "yellow"); 
			this.updatePName(pname);
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0];
				return nextLink;	
			}
			else if (link.from == this.key) {
				var nextLink = this.findLinksInto(null)[0];
				return nextLink;
			}
		}

		updatePName(pname) {
			this.pname = pname;
			this.text = "&"+pname+"";
		}

		copy() {
			return new NameInstance(this.pname);
		}
	}

	return NameInstance;
}); 