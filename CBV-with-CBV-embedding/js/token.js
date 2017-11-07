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
		this.setLink(null);
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
		this.dataStack = [CompData.PROMPT];
		this.boxStack = [];
		this.copyStack = [CopyData.C];
	}
}

var CompData = {
	PROMPT: '*',
	LAMBDA: 'λ',
	R: '@',
	I: 'I',
	DELTA: 'Δ',
	UNIT: '•',
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
	F_INTER: '<I>',
	F_U: '<U>',
	F_DELTA: '<∇>',
	F_MODIFY: '<Δ>',
	F_PROP: '<P>',
}

var BoxData = {

}

var CopyData = {
	C: '©',
	U: 'U',
}

