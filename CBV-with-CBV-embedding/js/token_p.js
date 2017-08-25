class PropToken extends MachineToken {

	constructor(machine, link) {
		super(machine);
		this.colour = 'cyan';
		this.forward = false;
		this.setLink(link);
		this.evalToken = new EvaluationToken(machine);
		this.evalToken.isMain = false;
		this.mNodes = [];
		this.evaluating = false;
	}

	reset() {
		super.reset();
		this.node = null;
		this.evalToken = new EvaluationToken(this.machine);
		this.evalToken.isMain = false;
		this.mNodes = [];
		this.evaluating = false;
	}
	
}