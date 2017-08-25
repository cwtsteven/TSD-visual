class AnalysisToken extends MachineToken {

	constructor(machine, node, link) {
		super(machine);
		this.colour = 'green';
		this.node = node;
		this.forward = false;
		this.setLink(link);
	}

	reset() {
		super.reset();
		this.node = null;
	}
	
}