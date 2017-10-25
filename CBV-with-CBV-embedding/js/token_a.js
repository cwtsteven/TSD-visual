class AnalysisToken extends MachineToken {

	constructor(machine, link) {
		super(machine);
		this.colour = 'green';
		this.mNodes = [];
		this.forward = false;
		this.setLink(link);
		this.halt = false;
	}

	reset() {
		super.reset();
		this.node = null;
	}
	
}