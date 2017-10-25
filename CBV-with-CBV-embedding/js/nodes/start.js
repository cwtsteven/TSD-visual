class Start extends Node {

	constructor() {
		super("point", "");
	}
	
	transition(token) {
		if (token.link == null && token.dataStack.last() == CompData.PROMPT) {
			token.forward = true;
			return this.findLinksOutOf(null)[0];
		}
		else 
			return null;
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
		return new Start();
	}

	draw(level) {
		return level + this.key + '[shape=' + this.shape + '];'; 
	}

}