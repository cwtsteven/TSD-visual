class PropToken extends MachineToken {

	constructor(machine, link) {
		super(machine);
		this.colour = 'green';
		this.forward = false;
		this.setLink(link);
		machine.propTokens.push(this);
	}

	reset() {
		super.reset();
		this.node = null;
	}

	delete() {
		this.setLink(null);
		this.machine.propTokens.splice(this.machine.propTokens.indexOf(this),1);
	}
	
}