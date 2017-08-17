class MachineToken {

	constructor() {
		this.reset();
	}

	setLink(link) {
		if (this.link != null)
			this.link.clearFocus();
		this.link = link;
		if (this.link != null) {
			if (this.forward) {
				this.from = link.from;
				this.to = link.to;
			}
			else {
				this.from = link.to;
				this.to = link.from;
			}
			this.link.focus("red");
		}
	}

	reset() {
		this.forward = true;
		this.rewrite = false;
		this.transited = false;
		
		this.from = null; // logical from
		this.to = null; // logical to
		this.link = null;
		
		this.rewriteFlag = RewriteFlag.EMPTY;
		this.dataStack = [CompData.PROMPT];
		this.boxStack = [];
	}
}

var CompData = {
	PROMPT: '*',
	LAMBDA: 'λ',
	R: '@',
}

var RewriteFlag = {
	EMPTY: '□',
	F_LAMBDA: '<λ>',
	F_OP: '<$>',
	F_IF: '<if>',
	F_C: '<C>',
	F_PROMO: '<!>',
	F_RECUR: '<μ>',
}

var BoxData = {
}

