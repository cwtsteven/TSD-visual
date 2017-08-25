class MachineToken {

	constructor(machine) {
		this.machine = machine;
		this.reset();
	}

	setLink(link) {
		if (this.link != null) {
			this.link.tokens.splice(this.link.tokens.indexOf(this), 1);
			this.link.clearFocus();
		}
		this.link = link;
		if (this.link != null) {
			this.link.tokens.push(this);
			this.link.focus(this.colour);
		}
	}

	reset() {
		this.forward = true;
		this.transited = false;
		
		this.link = null;
	}
}

class EvaluationToken extends MachineToken {

	constructor(machine) {
		super(machine);
		this.colour = 'red';
	}

	reset() {
		super.reset();

		this.rewrite = false;
		this.rewriteFlag = RewriteFlag.EMPTY;
		this.modStack = [ModData.NOCOPY];
		this.dataStack = [CompData.PROMPT];
		this.boxStack = [];
	}
}

var CompData = {
	PROMPT: '*',
	LAMBDA: 'λ',
	R: '@',
	M: 'M',
	DELTA: 'Δ',
}

var ModData = {
	NOCOPY: '©',
}

var RewriteFlag = {
	EMPTY: '□',
	F_LAMBDA: '<λ>',
	F_OP: '<$>',
	F_IF: '<if>',
	F_C: '<C>',
	F_PROMO: '<!>',
	F_RECUR: '<μ>',
	F_MOD: '<M>',
	F_MPROMO: '<!M>',
	F_DELTA: '<∇>',
	F_MODIFY: '<Δ>',
	F_PROP: '<P>',
}

var BoxData = {

}

